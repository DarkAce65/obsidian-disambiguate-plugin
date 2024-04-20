import { around } from 'monkey-around';
import { Plugin, TFile, Workspace, getLinkpath } from 'obsidian';

import DisambiguationView, {
  DISAMBIGUATION_VIEW_TYPE,
  DisambiguationViewState,
} from './DisambiguationView.tsx';
import FileAliasesMap from './FileAliasesMap.ts';

class DisambiguatePlugin extends Plugin {
  onload(): void {
    const fileAliases = new FileAliasesMap();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const cachedMetadata = this.app.metadataCache.getFileCache(file);
      if (cachedMetadata !== null) {
        fileAliases.updateFileAliases(file, cachedMetadata);
      }
    }

    this.registerView(
      DISAMBIGUATION_VIEW_TYPE,
      (leaf) => new DisambiguationView(leaf, fileAliases),
    );
    this.registerHoverLinkSource(DISAMBIGUATION_VIEW_TYPE, {
      defaultMod: false,
      display: 'Disambiguation view',
    });

    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile) {
          const cache = this.app.metadataCache.getFileCache(file);
          if (cache !== null) {
            fileAliases.updateFileAliases(file, cache);
          }
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          fileAliases.removeFile(file);
        }
      }),
    );

    this.registerEvent(
      this.app.metadataCache.on('changed', (file, data, cache) => {
        fileAliases.updateFileAliases(file, cache);
      }),
    );

    this.register(
      around(Workspace.prototype, {
        openLinkText: (_openLinkText) => {
          const app = this.app;

          return async function (this: Workspace, ...args) {
            const [linktext, sourcePath, newLeaf] = args;
            const linkpath = getLinkpath(linktext);

            const bestMatch = app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
            if (bestMatch === null) {
              // TODO: Handle no matching link
              return Promise.resolve();
            }

            const potentialMatches = fileAliases.getLinkMatches(
              linktext,
              app.vault.getFileByPath(sourcePath)!,
            );
            if (potentialMatches.length > 1) {
              const state: DisambiguationViewState = { linktext, sourcePath };
              return this.getLeaf(newLeaf).setViewState({
                type: DISAMBIGUATION_VIEW_TYPE,
                active: true,
                state,
              });
            }

            return _openLinkText.apply(this, args);
          };
        },
      }),
    );
  }
}

export default DisambiguatePlugin;
