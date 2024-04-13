import { matchSorter, rankings } from 'match-sorter';
import { CachedMetadata, TFile, parseFrontMatterAliases, parseFrontMatterEntry } from 'obsidian';

import SetMultimap from './SetMultimap.ts';
import { compareFileDistance } from './utils.ts';

class FileAliasesMap {
  private fileToAliases: SetMultimap<TFile, string>;
  private aliasToFiles: SetMultimap<string, TFile>;

  constructor() {
    this.fileToAliases = new SetMultimap();
    this.aliasToFiles = new SetMultimap();
  }

  private getAliases(cache: CachedMetadata): Set<string> {
    const aliases = new Set<string>();
    const title: string | null = parseFrontMatterEntry(cache.frontmatter, 'title');
    const frontmatterAliases = parseFrontMatterAliases(cache.frontmatter);
    if (title !== null) {
      aliases.add(title);
    }
    if (frontmatterAliases !== null) {
      for (const alias of frontmatterAliases) {
        aliases.add(alias);
      }
    }
    return aliases;
  }

  private getFilesWithAliases(sourceFile: TFile): [TFile, Set<string>][] {
    return Array.from(this.fileToAliases.entriesByKey()).filter(
      ([file]) => file.path !== sourceFile.path,
    );
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
    const aliases = this.getAliases(cache);

    this.fileToAliases.set(file, aliases);
    for (const alias of aliases) {
      if (existingAliases === undefined || !existingAliases.has(alias)) {
        this.aliasToFiles.add(alias, file);
      }
    }
    if (existingAliases !== undefined) {
      for (const existingAlias of existingAliases) {
        if (!aliases.has(existingAlias)) {
          this.aliasToFiles.remove(existingAlias, file);
        }
      }
    }
  }
}

export default FileAliasesMap;
