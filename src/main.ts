import { around } from 'monkey-around';
import { Plugin, TFile, Workspace, getLinkpath } from 'obsidian';

import DisambiguationView, {
  DISAMBIGUATION_VIEW_TYPE,
  DisambiguationViewState,
} from './DisambiguationView.tsx';
import UnresolvedLinkModal from './UnresolvedLinkModal.tsx';
import FileAliasesMap from './utils/FileAliasesMap.ts';
import { createFile, replaceLinksInFile, revealActiveFileInNavigation } from './utils/utils.ts';

class DisambiguatePlugin extends Plugin {
  onload(): void {
    const fileAliases = new FileAliasesMap();

    let fileAliasesInitialized = false;
    const initializeFileAliasesIfNeeded = (): void => {
      if (
        !(this.app.metadataCache as unknown as { initialized: boolean }).initialized ||
        fileAliasesInitialized
      ) {
        return;
      }

      for (const file of this.app.vault.getMarkdownFiles()) {
        const cachedMetadata = this.app.metadataCache.getFileCache(file);
        if (cachedMetadata !== null) {
          fileAliases.updateFileAliases(file, cachedMetadata);
        }
      }
      fileAliasesInitialized = true;
    };

    initializeFileAliasesIfNeeded();
    this.registerEvent(
      this.app.metadataCache.on('resolved', () => {
        initializeFileAliasesIfNeeded();
      }),
    );

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
            const sourceFile = app.vault.getFileByPath(sourcePath)!;

            const bestMatch = app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
            if (bestMatch === null) {
              const modal = new UnresolvedLinkModal(app, fileAliases, {
                linktext,
                sourceFile,
                createNewNote: (path, folder) => {
                  createFile(app, folder, path)
                    .then((file) => {
                      // No need to await this
                      replaceLinksInFile(app, sourceFile, file, linktext);

                      modal.close();

                      const newLinktext = app.metadataCache.fileToLinktext(file, sourcePath);
                      return _openLinkText.apply(this, [newLinktext, args[1], args[2], args[3]]);
                    })
                    .then(() => {
                      // @ts-expect-error Missing upstream type
                      revealActiveFileInNavigation(app);
                    });
                },
                linkToExistingNote: (file) => {
                  // No need to await this
                  replaceLinksInFile(app, sourceFile, file, linktext);

                  modal.close();

                  const newLinktext = app.metadataCache.fileToLinktext(file, sourcePath);
                  _openLinkText.apply(this, [newLinktext, args[1], args[2], args[3]]);
                },
              });

              modal.open();
              return Promise.resolve();
            }

            const potentialMatches = fileAliases.getLinkMatches(linktext, sourceFile);
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

    console.log(`Loaded ${this.manifest.name} plugin`);
  }
}

export default DisambiguatePlugin;
