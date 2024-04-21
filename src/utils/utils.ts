import { App, Command, Notice, Pos, TFile, TFolder, View, Workspace } from 'obsidian';

import { SuggestedFolder } from '../FolderPathInputSuggest.tsx';
import NoticeWithAction from '../NoticeWithAction.tsx';

function ensureLeadingAndTrailingSlash(path: string): string {
  let normalizedPath = path;
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (!normalizedPath.endsWith('/')) {
    normalizedPath = `${normalizedPath}/`;
  }
  return normalizedPath;
}

export function ensureExtension(path: string, extension: string): string {
  return path.toLowerCase().endsWith(`.${extension.toLowerCase()}`) ? path : `${path}.${extension}`;
}

export async function createFile(app: App, folder: SuggestedFolder, path: string): Promise<TFile> {
  if (folder.type === 'new') {
    await app.vault.createFolder(folder.path);
  }

  return app.vault.create(path, '');
}

export async function replaceLinksInFile(
  app: App,
  sourceFile: TFile,
  targetFile: TFile,
  originalLinktext: string,
): Promise<void> {
  const changes: [Pos, string][] = [];
  const links = app.metadataCache.getFileCache(sourceFile)!.links;
  for (const { link, displayText, original, position } of links!) {
    const newMarkdownLink = app.fileManager.generateMarkdownLink(
      targetFile,
      sourceFile.path,
      undefined,
      displayText,
    );
    if (link === originalLinktext && original !== newMarkdownLink) {
      changes.push([position, newMarkdownLink]);
    }
  }

  if (changes.length === 0) {
    return;
  }

  changes.sort(([a], [b]) => b.start.offset - a.start.offset);
  let previousData: string;
  await app.vault.process(sourceFile, (data) => {
    previousData = data;
    let updatedData = data;
    for (const [position, newMarkdownLink] of changes) {
      const before = updatedData.slice(0, position.start.offset);
      const after = updatedData.slice(position.end.offset);
      updatedData = `${before}${newMarkdownLink}${after}`;
    }
    return updatedData;
  });

  new NoticeWithAction({
    message: `Updated ${changes.length} ${
      changes.length === 1 ? 'link' : 'links'
    } in ${sourceFile.path}`,
    actionText: 'Undo',
    onClick: (notice) => {
      notice.hide();
      app.vault
        .process(sourceFile, () => previousData)
        .then(() => {
          new Notice(`Reverted changes to ${sourceFile.path}`);
        });
    },
  });
}

export function getFolderPaths(root: TFolder): string[] {
  const childFolders = root.children.filter((f): f is TFolder => f instanceof TFolder);
  if (childFolders.length === 0) {
    return [root.path];
  }

  return [root.path, ...childFolders.flatMap((childFolder) => getFolderPaths(childFolder))];
}

export function revealActiveFileInNavigation(
  app: App & {
    commands: { findCommand: (id: string) => Command; executeCommandById: (id: string) => boolean };
  },
): void {
  if (app.commands.findCommand('file-explorer:reveal-active-file')) {
    app.commands.executeCommandById('file-explorer:reveal-active-file');
  }
}

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

enum FileRelationRank {
  SIBLING = 0,
  CHILD = 1,
  PARENT = 2,
  SHARED_ANCESTOR = 3,
}

export function getFileRelation(
  sourceFile: TFile,
  file: TFile,
):
  | { type: FileRelationRank.SIBLING; distance: 0 }
  | { type: FileRelationRank.CHILD; distance: number }
  | { type: FileRelationRank.PARENT; distance: number }
  | { type: FileRelationRank.SHARED_ANCESTOR; distance: number } {
  const sourceFileDir = ensureLeadingAndTrailingSlash(sourceFile.parent!.path);
  const fileDir = ensureLeadingAndTrailingSlash(file.parent!.path);

  if (sourceFileDir === fileDir) {
    return { type: FileRelationRank.SIBLING, distance: 0 };
  } else if (fileDir.startsWith(sourceFileDir)) {
    return {
      type: FileRelationRank.CHILD,
      distance: fileDir.replace(sourceFileDir, '').split('/').length,
    };
  } else if (sourceFileDir.startsWith(fileDir)) {
    return {
      type: FileRelationRank.PARENT,
      distance: sourceFileDir.replace(fileDir, '').split('/').length,
    };
  }

  let hasSplit = false;
  let sharedDepth = 0;
  for (let i = 0; i < sourceFileDir.length; i++) {
    const c = sourceFileDir[i];
    if (hasSplit) {
      if (c === '/') {
        sharedDepth += 1;
      }
    } else {
      if (i >= fileDir.length || c !== fileDir[i]) {
        hasSplit = true;
        sharedDepth += 1;
      }
    }
  }

  return { type: FileRelationRank.SHARED_ANCESTOR, distance: sharedDepth };
}

export function compareFileDistance(baseFile: TFile, a: TFile, b: TFile): number {
  const fileRelationA = getFileRelation(baseFile, a);
  const fileRelationB = getFileRelation(baseFile, b);

  return (
    fileRelationA.type - fileRelationB.type ||
    fileRelationA.distance - fileRelationB.distance ||
    a.path.localeCompare(b.path)
  );
}
