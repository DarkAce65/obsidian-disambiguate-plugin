import { matchSorter } from 'match-sorter';
import { AbstractInputSuggest, App, Modal, SuggestModal, TFile, normalizePath } from 'obsidian';
import { ParentProps, createMemo, createSignal, onMount } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { render } from 'solid-js/web';

import FileAliasesMap from './FileAliasesMap.ts';
import { ensureExtension, getFolderPaths } from './utils.ts';

interface SuggestedFolder {
  type: 'new' | 'existing' | 'placeholder';
  path: string;
}

class FolderPathInputSuggest extends AbstractInputSuggest<SuggestedFolder> {
  private existingFolderSuggestions: SuggestedFolder[];

  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private onChange: (folder: SuggestedFolder) => void,
  ) {
    super(app, inputEl);

    const existingFolderPaths = new Set(getFolderPaths(app.vault.getRoot()));
    this.existingFolderSuggestions = Array.from(existingFolderPaths).map((folderPath) => ({
      type: 'existing',
      path: folderPath,
    }));

    inputEl.addEventListener('input', () => {
      const path = normalizePath(inputEl.value);
      onChange({ type: existingFolderPaths.has(path) ? 'existing' : 'new', path });
    });
    inputEl.addEventListener('blur', () => {
      if (inputEl.value.trim().length === 0) {
        inputEl.value = '/';
      }
    });
  }

  override getSuggestions(query: string): SuggestedFolder[] | Promise<SuggestedFolder[]> {
    const normalizedQuery = normalizePath(query.trim());

    const results = matchSorter(this.existingFolderSuggestions, normalizedQuery, {
      keys: [(folder) => folder.path],
    });

    for (const result of results) {
      if (result.path === normalizedQuery) {
        return [...results, { type: 'placeholder', path: 'Type to enter' }];
      }
    }

    if (normalizedQuery.length > 0) {
      return [...results, { type: 'new', path: normalizedQuery }];
    }

    return results;
  }

  override renderSuggestion(value: SuggestedFolder, el: HTMLElement): void {
    switch (value.type) {
      case 'existing':
        el.innerHTML = value.path;
        break;
      case 'new':
        el.innerHTML = `${value.path} <small><i>(new folder)</i></small>`;
        break;
      case 'placeholder':
        el.innerHTML = '<i>Type to create a new folder</i>';
        break;
    }
  }

  override selectSuggestion(value: SuggestedFolder): void {
    if (value.type === 'placeholder') {
      return;
    }

    this.onChange(value);
    this.setValue(value.path);
    this.close();
  }
}

class FileSuggestModal extends SuggestModal<TFile> {
  constructor(
    app: App,
    private fileAliasesMap: FileAliasesMap,
    private sourceFile: TFile,
    private onChange: (file: TFile) => void,
  ) {
    super(app);
  }

  override getSuggestions(query: string): TFile[] | Promise<TFile[]> {
    return this.fileAliasesMap.search(query, this.sourceFile);
  }

  override renderSuggestion(value: TFile, el: HTMLElement): void {
    el.innerHTML = `${this.fileAliasesMap.getFileTitle(value)}<br/><small>${value.path}</small>`;
  }

  override onChooseSuggestion(value: TFile): void {
    this.onChange(value);
    this.close();
  }
}

function FormControl(props: ParentProps<{ label: string }>): JSX.Element {
  return (
    <label style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
      <span style={{ 'flex-basis': '100px' }}>{props.label}</span>
      <div style={{ 'flex-grow': 1 }}>{props.children}</div>
    </label>
  );
}

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

class UnresolvedLinkModal extends Modal {
  private dispose: (() => void) | null = null;

  constructor(
    app: App,
    private fileAliases: FileAliasesMap,
    private options: {
      linktext: string;
      sourceFile: TFile;
      createNewNote: (path: string) => void;
      linkToExistingNote: (file: TFile) => void;
    },
  ) {
    super(app);
  }

  onOpen(): void {
    this.dispose = render(
      () => (
        <UnresolvedLinkModalComponent
          app={this.app}
          fileAliases={this.fileAliases}
          linktext={this.options.linktext}
          sourceFile={this.options.sourceFile}
          createNewNote={this.options.createNewNote}
          linkToExistingNote={this.options.linkToExistingNote}
        />
      ),
      this.contentEl,
    );
  }

  onClose(): void {
    this.dispose?.();
  }
}

export default UnresolvedLinkModal;
