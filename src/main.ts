import { around } from 'monkey-around';
import { Plugin, Workspace, getLinkpath } from 'obsidian';

import DisambiguationView, {
  DISAMBIGUATION_VIEW_TYPE,
  DisambiguationViewState,
} from './DisambiguationView.tsx';

class DisambiguatePlugin extends Plugin {
  onload(): void {
    this.registerView(DISAMBIGUATION_VIEW_TYPE, (leaf) => new DisambiguationView(leaf));
    this.registerHoverLinkSource(DISAMBIGUATION_VIEW_TYPE, {
      defaultMod: false,
      display: 'Disambiguation view',
    });

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
