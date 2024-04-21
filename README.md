# Obsidian Disambiguate Plugin

A plugin for [Obsidian](https://obsidian.md/) to upgrade unresolved link handling and connect notes with similar titles/aliases.

The plugin tracks note titles and aliases (using the `title` and `aliases` frontmatter properties) and intercepts the standard behavior when clicking links to open a disambiguation page when there are multiple notes that match the clicked link.

This plugin also gives you more control over what happens when an unresolved link is clicked - the plugin will prompt for either a new note at a location of your choice or to link to an existing note and will update links in the original note to point to the new note you've created or selected.
