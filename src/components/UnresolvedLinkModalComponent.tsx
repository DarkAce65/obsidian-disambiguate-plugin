import { posix as posixPath } from 'path';

import { App, TFile, normalizePath } from 'obsidian';
import { JSX, createMemo, createSignal, onMount } from 'solid-js';

import FileSuggestModal from '../FileSuggestModal.tsx';
import FolderPathInputSuggest, { SuggestedFolder } from '../FolderPathInputSuggest.tsx';
import FileAliasesMap from '../utils/FileAliasesMap.ts';
import { ensureExtension } from '../utils/utils.ts';

import FormControl from './FormControl.tsx';

function normalizeInitialValue(value: string): string {
  return value.toLowerCase().replaceAll(/[^0-9a-zA-Z-._ ]+/g, '_');
}

function parseFolderAndFilename(
  app: App,
  sourceFile: TFile,
  linktext: string,
): { folder: SuggestedFolder; filename: string } {
  let folder: SuggestedFolder;
  let filename: string;

  if (linktext.includes('/')) {
    const pathSegments = posixPath
      .resolve('/', sourceFile.parent!.path, linktext)
      .split('/')
      .filter((segment) => segment.length > 0);

    // Normalize any segments that don't correspond to an existing path
    let folderPath = '/';
    for (const segment of pathSegments.slice(0, -1)) {
      const newFolderPath = normalizePath(`${folderPath}/${segment}`);
      if (app.vault.getFolderByPath(newFolderPath) !== null) {
        folderPath = newFolderPath;
      } else {
        folderPath = normalizePath(`${folderPath}/${normalizeInitialValue(segment)}`);
      }
    }

    folder = {
      type: app.vault.getFolderByPath(folderPath) === null ? 'new' : 'existing',
      path: folderPath,
    };
    filename = normalizeInitialValue(pathSegments[pathSegments.length - 1]);
  } else {
    const newFileFolderPath = app.fileManager.getNewFileParent(sourceFile.path).path;
    folder = { type: 'existing', path: newFileFolderPath };
    filename = normalizeInitialValue(linktext);
  }

  return { folder, filename };
}

function UnresolvedLinkModalComponent(props: {
  app: App;
  fileAliases: FileAliasesMap;
  sourceFile: TFile;
  linktext: string;
  createNewNote: (path: string, folder: SuggestedFolder) => void;
  linkToExistingNote: (file: TFile) => void;
}): JSX.Element {
  let folderInput: HTMLInputElement;

  const [newFolder, setNewFolder] = createSignal<SuggestedFolder | null>(null);
  const [newFilename, setNewFilename] = createSignal('');
  const newFilePath = createMemo((): string | null => {
    const folder = newFolder();
    const filename = newFilename().trim();
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

    const { folder, filename } = parseFolderAndFilename(
      props.app,
      props.sourceFile,
      props.linktext,
    );
    setNewFolder(folder);
    setNewFilename(filename);
    folderInputSuggest.setValue(folder.path);
  });

  return (
    <div>
      <h1 tabindex={0}>"{props.linktext}" doesn't point to an existing note</h1>{' '}
      <p>
        <FormControl
          label="Folder"
          message={newFolder()?.type === 'new' ? 'Will create new folder(s)' : undefined}
        >
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
            const folder = newFolder();
            if (filePath !== null && folder !== null) {
              props.createNewNote(filePath, folder);
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
      <p style={{ 'text-align': 'center' }}>
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
      </p>
    </div>
  );
}

export default UnresolvedLinkModalComponent;
