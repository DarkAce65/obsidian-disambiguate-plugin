import { around } from 'monkey-around';
import { Plugin, Workspace, getLinkpath } from 'obsidian';

import UnresolvedLinkModal from './UnresolvedLinkModal.tsx';

class DisambiguatePlugin extends Plugin {
  onload(): void {
    this.register(
      around(Workspace.prototype, {
        openLinkText: (existingFunction) => {
          const app = this.app;

          return async function (this: Workspace, ...args) {
            const [linktext, sourcePath] = args;
            const bestMatch = app.metadataCache.getFirstLinkpathDest(
              getLinkpath(linktext),
              sourcePath,
            );

            if (bestMatch === null) {
              new UnresolvedLinkModal(app, linktext).open();
              return Promise.resolve();
            }
            return existingFunction.apply(this, args);
          };
        },
      }),
    );
  }
}

export default DisambiguatePlugin;
