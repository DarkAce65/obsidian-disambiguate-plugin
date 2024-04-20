import { App, Keymap, PaneType, TFile, View } from 'obsidian';
import { For, JSX, createMemo } from 'solid-js';

import FileAliasesMap from '../utils/FileAliasesMap.ts';
import { hoverLink } from '../utils/utils.ts';

function DisambiguationPage(props: {
  view: View;
  fileAliases: FileAliasesMap;
  linktext: string;
  sourcePath: string;
  openFile: (file: TFile, newLeaf: PaneType | boolean) => void;
}): JSX.Element {
  const app = (): App => props.view.app;
  const matchedFiles = createMemo<TFile[]>(() =>
    props.fileAliases.getLinkMatches(props.linktext, app().vault.getFileByPath(props.sourcePath)!),
  );
  const filesWithData = createMemo(() =>
    matchedFiles().map((file) => {
      const linktext = app().metadataCache.fileToLinktext(file, '');
      const title = props.fileAliases.getFileTitle(file);
      return { file, linktext, title };
    }),
  );

  return (
    <>
      <h1>"{props.linktext}" could refer to multiple notes</h1>
      <For each={filesWithData()}>
        {({ file, linktext, title }) => (
          <ul>
            <li>
              <a
                role="button"
                tabindex="0"
                style={{ 'margin-right': '12px' }}
                onMouseOver={(event) => {
                  hoverLink(app().workspace, props.view, event, linktext);
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
                {title}
              </a>
              <small>{file.path}</small>
            </li>
          </ul>
        )}
      </For>
    </>
  );
}

export default DisambiguationPage;
