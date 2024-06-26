import { matchSorter } from 'match-sorter';
import { AbstractInputSuggest, App, normalizePath } from 'obsidian';

import { getFolderPaths } from './utils/utils.ts';

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
        this.setValue('/');
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
        return [...results, { type: 'placeholder', path: 'Type to create new folder(s)' }];
      }
    }

    return results;
  }

  override renderSuggestion(value: SuggestedFolder, el: HTMLElement): void {
    switch (value.type) {
      case 'new':
      case 'existing':
        el.innerHTML = value.path;
        break;
      case 'placeholder':
        el.innerHTML = `<i>${value.path}</i>`;
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
