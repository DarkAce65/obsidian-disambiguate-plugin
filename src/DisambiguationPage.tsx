import {
  App,
  Keymap,
  PaneType,
  TFile,
  View,
  parseFrontMatterAliases,
  parseFrontMatterEntry,
} from 'obsidian';
import { For, JSX, createMemo } from 'solid-js';

import FileAliasesMap from './FileAliasesMap.ts';
import { hoverLink } from './utils.ts';

function DisambiguationPage(props: {
  view: View;
  fileAliases: FileAliasesMap;
  sourcePath: string;
  linktext: string;
  openFile: (file: TFile, newLeaf: PaneType | boolean) => void;
}): JSX.Element {
  const app = (): App => props.view.app;
  const matchedFiles = createMemo<TFile[]>(() =>
    props.fileAliases.getMatches(props.linktext, app().vault.getFileByPath(props.sourcePath)!),
  );
  const filesWithData = createMemo(() =>
    matchedFiles().map((file) => {
      const frontmatter = app().metadataCache.getFileCache(file)?.frontmatter;
      const linktext = app().metadataCache.fileToLinktext(file, '');
      const title = (parseFrontMatterEntry(frontmatter, 'title') as string | null) ?? file.basename;
      const aliases =
        parseFrontMatterAliases(frontmatter)?.filter((alias) => alias !== title) ?? [];
      return { file, linktext, title, aliases };
    }),
  );

  return (
    <>
      <h1>"{props.linktext}" could refer to multiple notes</h1>
      <For each={filesWithData()}>
        {({ file, linktext, title, aliases }) => (
          <>
            <p>
              <span>
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
                <code>
                  <small>{file.path}</small>
                </code>
              </span>
              {aliases.length > 0 && (
                <>
                  <br />
                  <small>Also known as: {aliases.join(', ')}</small>
                </>
              )}
            </p>
          </>
        )}
      </For>
    </>
  );
}

export default DisambiguationPage;
