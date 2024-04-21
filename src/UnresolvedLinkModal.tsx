import { App, Modal, TFile } from 'obsidian';
import { render } from 'solid-js/web';

import { SuggestedFolder } from './FolderPathInputSuggest.tsx';
import UnresolvedLinkModalComponent from './components/UnresolvedLinkModalComponent.tsx';
import FileAliasesMap from './utils/FileAliasesMap.ts';

class UnresolvedLinkModal extends Modal {
  private dispose: (() => void) | null = null;

  constructor(
    app: App,
    private fileAliases: FileAliasesMap,
    private options: {
      linktext: string;
      sourceFile: TFile;
      createNewNote: (path: string, folder: SuggestedFolder) => void;
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
