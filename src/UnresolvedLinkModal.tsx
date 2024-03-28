import { App, Modal } from 'obsidian';
import { JSX } from 'solid-js/jsx-runtime';
import { render } from 'solid-js/web';

function UnresolvedLinkModalComponent(props: { title: string }): JSX.Element {
  return (
    <>
      <h1>This link has no reference</h1>
      <p>{props.title}</p>
    </>
  );
}

class UnresolvedLinkModal extends Modal {
  private dispose: (() => void) | null = null;

  constructor(
    app: App,
    private title: string,
  ) {
    super(app);
  }

  onOpen(): void {
    this.dispose = render(
      () => <UnresolvedLinkModalComponent title={this.title} />,
      this.contentEl,
    );
  }

  onClose(): void {
    this.dispose?.();
  }
}

export default UnresolvedLinkModal;
