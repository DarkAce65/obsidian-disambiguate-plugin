import { TFile, TFolder, View, Workspace } from 'obsidian';

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

export function getFolderPaths(root: TFolder): string[] {
  const childFolders = root.children.filter((f): f is TFolder => f instanceof TFolder);
  if (childFolders.length === 0) {
    return [root.path];
  }

  return [root.path, ...childFolders.flatMap((childFolder) => getFolderPaths(childFolder))];
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
