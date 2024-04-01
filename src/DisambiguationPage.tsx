import { App, Keymap, PaneType, TFile, View } from 'obsidian';
import { For, JSX, createMemo } from 'solid-js';

import { hoverLink } from './utils.ts';

function DisambiguationPage(props: {
  view: View;
  linktext: string;
  openFile: (file: TFile, newLeaf: PaneType | boolean) => void;
}): JSX.Element {
  const app = (): App => props.view.app;
  const items = createMemo<TFile[]>(() => app().vault.getFiles());

  return (
    <>
      <h1>"{props.linktext}" could refer to multiple notes</h1>
      <For each={items()}>
        {(file) => (
          <p>
            <a
              role="button"
              tabindex="0"
              onMouseOver={(event) => {
                hoverLink(
                  app().workspace,
                  props.view,
                  event,
                  app().metadataCache.fileToLinktext(file, ''),
                );
              }}
              onClick={(event) => {
                props.openFile(file, Keymap.isModEvent(event));
              }}
              onMouseDown={(event) => {
                if (event.button === 1) {
                  props.openFile(file, Keymap.isModEvent(event));
                }
              }}
            >
              {file.path}
            </a>
          </p>
        )}
      </For>
    </>
  );
}

export default DisambiguationPage;
