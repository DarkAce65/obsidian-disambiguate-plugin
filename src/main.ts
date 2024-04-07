import { around } from 'monkey-around';
import { CachedMetadata, Plugin, TFile, Workspace, getLinkpath } from 'obsidian';

import DisambiguationView, {
  DISAMBIGUATION_VIEW_TYPE,
  DisambiguationViewState,
} from './DisambiguationView.tsx';
import FileAliasesMap from './FileAliasesMap.ts';

class DisambiguatePlugin extends Plugin {
  onload(): void {
    this.registerView(DISAMBIGUATION_VIEW_TYPE, (leaf) => new DisambiguationView(leaf));
    this.registerHoverLinkSource(DISAMBIGUATION_VIEW_TYPE, {
      defaultMod: false,
      display: 'Disambiguation view',
    });

    const fileAliases = new FileAliasesMap();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const cachedMetadata = this.app.metadataCache.getFileCache(file);
      if (cachedMetadata !== null) {
        fileAliases.updateFileAliases(file, cachedMetadata);
      }
    }

    const onFileChange = (file: TFile, cache: CachedMetadata): void => {
      fileAliases.updateFileAliases(file, cache);
    };

    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile) {
          const cache = this.app.metadataCache.getFileCache(file);
          if (cache !== null) {
            onFileChange(file, cache);
          }
        }
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on('changed', (file, data, cache) => {
        onFileChange(file, cache);
      }),
    );

    this.register(
      around(Workspace.prototype, {
        openLinkText: (existingFunction) => {
          const app = this.app;

          return async function (this: Workspace, ...args) {
            const [linktext, sourcePath, newLeaf] = args;
            const bestMatch = app.metadataCache.getFirstLinkpathDest(
              getLinkpath(linktext),
              sourcePath,
            );

            if (bestMatch === null) {
              const state: DisambiguationViewState = { linktext, sourcePath };
              return this.getLeaf(newLeaf).setViewState({
                type: DISAMBIGUATION_VIEW_TYPE,
                active: true,
                state,
              });
            }
            return existingFunction.apply(this, args);
          };
        },
      }),
    );
  }
}

export default DisambiguatePlugin;
