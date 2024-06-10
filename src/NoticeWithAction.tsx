import { Notice } from 'obsidian';

class NoticeWithAction {
  private notice: Notice;

  constructor({
    message,
    duration = 30_000,
    actionText,
    onClick,
  }: {
    message: string;
    duration?: number;
    actionText: string;
    onClick: (notice: Notice) => void;
  }) {
    const fragment = createFragment();

    const div = createDiv();
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.gap = 'var(--size-4-3)';
    div.appendText(message);

    const a = createEl('a');
    a.style.flexShrink = '0';
    a.innerText = actionText;
    a.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(this.notice);
    });
    div.appendChild(a);

    fragment.appendChild(div);

    this.notice = new Notice(fragment, duration);
  }
}

export default NoticeWithAction;
