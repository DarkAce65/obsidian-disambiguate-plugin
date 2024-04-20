import { matchSorter } from 'match-sorter';
import { AbstractInputSuggest, App, normalizePath } from 'obsidian';

import { getFolderPaths } from './utils.ts';

export interface SuggestedFolder {
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

export default FolderPathInputSuggest;
