import { IconName, ItemView, PaneType, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import { render } from 'solid-js/web';

import DisambiguationPage from './components/DisambiguationPage.tsx';
import FileAliasesMap from './utils/FileAliasesMap.ts';

export const DISAMBIGUATION_VIEW_TYPE = 'disambiguation-view';

export interface DisambiguationViewState {
  linktext: string;
  sourcePath: string;
  newLeaf?: PaneType | boolean;
}

class DisambiguationView extends ItemView {
  private dispose: (() => void) | null = null;
  private state: DisambiguationViewState | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private fileAliases: FileAliasesMap,
  ) {
    super(leaf);
  }

  override getViewType(): string {
    return DISAMBIGUATION_VIEW_TYPE;
  }

  override getDisplayText(): string {
    if (this.state === null) {
      return 'Disambiguation';
    }
    return `${this.state.linktext} (Disambiguation)`;
  }

  override getIcon(): IconName {
    return 'lucide-split';
  }

  private openFile(file: TFile, newLeaf: PaneType | boolean): void {
    const leaf = newLeaf === false ? this.leaf : this.app.workspace.getLeaf(newLeaf);
    leaf.setViewState({ type: 'markdown', active: true, state: { file: file.path } });
  }

  private render(): void {
    this.dispose?.();

    if (this.state !== null) {
      const { linktext, sourcePath } = this.state;
      this.dispose = render(
        () => (
          <DisambiguationPage
            view={this}
            fileAliases={this.fileAliases}
            linktext={linktext}
            sourcePath={sourcePath}
            openFile={this.openFile.bind(this)}
          />
        ),
        this.contentEl,
      );
    }
  }

  override getState(): DisambiguationViewState | null {
    return this.state;
  }

  override setState(state: DisambiguationViewState, result: ViewStateResult): Promise<void> {
    this.state = state;
    this.render();
    return super.setState(state, result);
  }

  override async onOpen(): Promise<void> {
    this.render();
    return super.onOpen();
  }

  override onClose(): Promise<void> {
    this.dispose?.();
    this.dispose = null;
    this.state = null;

    return super.onClose();
  }
}

export default DisambiguationView;
