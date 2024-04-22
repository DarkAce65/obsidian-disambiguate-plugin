import { matchSorter, rankings } from 'match-sorter';
import {
  CachedMetadata,
  TAbstractFile,
  TFile,
  parseFrontMatterAliases,
  parseFrontMatterEntry,
} from 'obsidian';

import SetMultimap from './SetMultimap.ts';
import { compareFileDistance } from './utils.ts';

class FileAliasesMap {
  private fileToTitle: Map<TFile, string | null>;
  private fileToAliases: SetMultimap<TFile, string>;
  private aliasToFiles: SetMultimap<string, TFile>;

  constructor() {
    this.fileToTitle = new Map();
    this.fileToAliases = new SetMultimap();
    this.aliasToFiles = new SetMultimap();
  }

  static isMarkdownFile(file: TAbstractFile): file is TFile {
    return file instanceof TFile && file.extension.toLowerCase() === 'md';
  }

  private getAliasesFromMetadata(cache: CachedMetadata): {
    title: string | null;
    allAliases: Set<string>;
  } {
    const allAliases = new Set<string>();
    const title: string | null = parseFrontMatterEntry(cache.frontmatter, 'title');
    const frontmatterAliases = parseFrontMatterAliases(cache.frontmatter);
    if (title !== null) {
      allAliases.add(title);
    }
    if (frontmatterAliases !== null) {
      for (const alias of frontmatterAliases) {
        allAliases.add(alias);
      }
    }
    return { title, allAliases };
  }

  private getFilesWithAliases(sourceFile: TFile): [TFile, Set<string>][] {
    return Array.from(this.fileToAliases.entriesByKey()).filter(
      ([file]) => file.path !== sourceFile.path,
    );
  }

  getFileTitle(file: TFile): string {
    return this.fileToTitle.get(file) ?? file.basename;
  }

  getAliases(file: TFile): Set<string> | undefined {
    return this.fileToAliases.get(file);
  }

  search(query: string, sourceFile: TFile): TFile[] {
    return matchSorter(this.getFilesWithAliases(sourceFile), query, {
      keys: [([file, aliases]) => [file.path, ...aliases]],
      baseSort: ({ item: [a] }, { item: [b] }) => compareFileDistance(sourceFile, a, b),
    }).map(([file]) => file);
  }

  getLinkMatches(linktext: string, sourceFile: TFile): TFile[] {
    return matchSorter(this.getFilesWithAliases(sourceFile), linktext, {
      keys: [([, aliases]) => Array.from(aliases)],
      threshold: rankings.WORD_STARTS_WITH,
      baseSort: ({ item: [a] }, { item: [b] }) => compareFileDistance(sourceFile, a, b),
    }).map(([file]) => file);
  }

  updateFileAliases(file: TFile, cache: CachedMetadata): void {
    const existingAliases = this.fileToAliases.get(file);
    const { title, allAliases } = this.getAliasesFromMetadata(cache);

    this.fileToTitle.set(file, title);
    this.fileToAliases.set(file, allAliases);
    for (const alias of allAliases) {
      if (existingAliases === undefined || !existingAliases.has(alias)) {
        this.aliasToFiles.add(alias, file);
      }
    }
    if (existingAliases !== undefined) {
      for (const existingAlias of existingAliases) {
        if (!allAliases.has(existingAlias)) {
          this.aliasToFiles.remove(existingAlias, file);
        }
      }
    }
  }

  removeFile(file: TFile): void {
    const existingAliases = this.fileToAliases.get(file);
    if (existingAliases !== undefined) {
      for (const existingAlias of existingAliases) {
        this.aliasToFiles.remove(existingAlias, file);
      }
    }
    this.fileToTitle.delete(file);
    this.fileToAliases.delete(file);
  }
}

export default FileAliasesMap;
