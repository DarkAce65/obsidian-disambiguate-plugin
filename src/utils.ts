import { View, Workspace } from 'obsidian';

export function hoverLink(
  workspace: Workspace,
  view: View,
  event: MouseEvent,
  linktext: string,
): void {
  workspace.trigger('hover-link', {
    event,
    source: view.getViewType(),
    hoverParent: view,
    targetEl: event.target,
    linktext,
  });
}
