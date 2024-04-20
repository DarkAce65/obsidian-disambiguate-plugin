import { App, TFile, normalizePath } from 'obsidian';
import { JSX, createMemo, createSignal, onMount } from 'solid-js';

import FileSuggestModal from '../FileSuggestModal.tsx';
import FolderPathInputSuggest, { SuggestedFolder } from '../FolderPathInputSuggest.tsx';
import FileAliasesMap from '../utils/FileAliasesMap.ts';
import { ensureExtension } from '../utils/utils.ts';

import FormControl from './FormControl.tsx';

function UnresolvedLinkModalComponent(props: {
  app: App;
  fileAliases: FileAliasesMap;
  sourceFile: TFile;
  linktext: string;
  createNewNote: (path: string) => void;
  linkToExistingNote: (file: TFile) => void;
}): JSX.Element {
  let folderInput: HTMLInputElement;

  const [newFolder, setNewFolder] = createSignal<SuggestedFolder | null>(null);
  // eslint-disable-next-line solid/reactivity
  const [newFilename, setNewFilename] = createSignal(props.linktext);
  const newFilePath = createMemo((): string | null => {
    const folder = newFolder();
    const filename = newFilename();
    return folder !== null && filename.length > 0
      ? ensureExtension(normalizePath(`${folder.path}/${filename}`), 'md')
      : null;
  });
  const canCreateFile = createMemo(() => {
    const folder = newFolder();
    if (folder !== null && folder.type !== 'existing') {
      return true;
    }
    const filePath = newFilePath();
    return filePath !== null && props.app.vault.getAbstractFileByPath(filePath) === null;
  });

  const [linkFile, setLinkFile] = createSignal<TFile | null>(null);
  const canLinkToFile = createMemo(() => linkFile() !== null);

  const fileSuggestModal = createMemo(
    () =>
      new FileSuggestModal(props.app, props.fileAliases, props.sourceFile, (file) =>
        setLinkFile(file),
      ),
  );

  onMount(() => {
    const folderInputSuggest = new FolderPathInputSuggest(
      props.app,
      folderInput,
      (suggestedFolder) => setNewFolder(suggestedFolder),
    );
    const initialFolder: SuggestedFolder = {
      type: 'existing',
      path: props.sourceFile.parent!.path,
    };
    setNewFolder(initialFolder);
    folderInputSuggest.setValue(initialFolder.path);
  });

  return (
    <div>
      <h1 tabindex={0}>"{props.linktext}" doesn't point to an existing note</h1>{' '}
      <p>
        <FormControl label="Folder">
          <input ref={folderInput!} type="text" style={{ width: '100%' }} />
        </FormControl>
      </p>
      <p>
        <FormControl label="Filename">
          <input
            type="text"
            value={newFilename()}
            style={{ width: '100%' }}
            onInput={(event) => {
              setNewFilename(event.currentTarget.value);
            }}
          />
        </FormControl>
      </p>
      <p style={{ 'text-align': 'center' }}>
        <button
          disabled={!canCreateFile()}
          class={canCreateFile() ? 'mod-cta' : 'mod-muted'}
          onClick={() => {
            const filePath = newFilePath();
            if (filePath) {
              props.createNewNote(filePath);
            }
          }}
        >
          Create a new note
        </button>
      </p>
      <hr />
      <p
        style={{
          display: 'flex',
          gap: '12px',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <input
          type="text"
          placeholder="Select an existing note..."
          value={linkFile()?.path ?? ''}
          readOnly={true}
          style={{ 'flex-grow': 1 }}
          onClick={() => fileSuggestModal().open()}
        />
        <button onClick={() => fileSuggestModal().open()}>...</button>
      </p>
      <p
        style={{
          display: 'flex',
          gap: '12px',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <button
          disabled={!canLinkToFile()}
          class={canLinkToFile() ? 'mod-cta' : 'mod-muted'}
          onClick={() => {
            const filePath = linkFile();
            if (filePath !== null) {
              props.linkToExistingNote(filePath);
            }
          }}
        >
          Link to existing note
        </button>
        <button
          disabled={!canLinkToFile()}
          class={canLinkToFile() ? 'mod-cta' : 'mod-muted'}
          onClick={() => {
            const filePath = linkFile();
            if (filePath !== null) {
              props.linkToExistingNote(filePath);
            }
          }}
        >
          Add alias to existing note
        </button>
      </p>
    </div>
  );
}

export default UnresolvedLinkModalComponent;
