import { App, SuggestModal, TFile } from 'obsidian';

import FileAliasesMap from './utils/FileAliasesMap.ts';

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

export default FileSuggestModal;
