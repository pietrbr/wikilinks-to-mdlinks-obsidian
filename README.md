# obsidian-link-converter

An Obsidian plugin to convert between wikilinks and markdown links. Based on [wikilinks-to-mdlinks-obsidian](https://github.com/agathauy/wikilinks-to-mdlinks-obsidian) by agathauy, extended with additional commands.

## Features

- **Toggle single link** — place your cursor inside any link and toggle it between wikilink and markdown format
- **Convert all links in file** — bulk-convert every wikilink to markdown, or every markdown link to wikilink
- Skips YAML frontmatter and fenced code blocks
- Preserves aliases and anchors (`#heading`)
- External URLs are not converted to wikilinks (shows a notice instead)
- Images are excluded from conversion

## Commands

| Command                                                  | Default hotkey         |
| -------------------------------------------------------- | ---------------------- |
| Toggle selected wikilink to markdown link and vice versa | `Ctrl/Cmd + Shift + L` |
| Convert all wikilinks in file to markdown links          | —                      |
| Convert all markdown links in file to wikilinks          | —                      |

## How to use

1. Place the cursor inside the link you want to convert.
2. Run the toggle command via hotkey `Ctrl/Cmd + Shift + L`, or open the command palette (`Ctrl/Cmd + P`) and search for "Toggle selected wikilink".
3. To convert the whole file at once, use the command palette and search for "Convert all".

## Installation

### From within Obsidian

1. Go to **Settings → Community plugins** and search for `obsidian-link-converter`.
2. Install and enable the plugin.

### Manual

1. Clone this repo into your vault's `.obsidian/plugins/` directory.
2. Run `npm install` and `npm run build`.
3. Enable the plugin in Obsidian settings.

## Development

```sh
npm install
npm run dev   # watch mode
```

## Credits

Based on [wikilinks-to-mdlinks-obsidian](https://github.com/agathauy/wikilinks-to-mdlinks-obsidian) by [@agathauy](https://github.com/agathauy).

## Version History

### 0.1.0

- Bulk-convert all wikilinks in a file to markdown links
- Bulk-convert all markdown links in a file to wikilinks
- Skip YAML frontmatter and fenced code blocks during conversion
- Notify when trying to convert an external link to wikilink
- Exclude images from conversion

### 0.0.5

- Updated for callback check

### 0.0.4

- Updated markdown link regex

### 0.0.3

- Updated certain functions as per Obsidian pull request recommendations

### 0.0.2

- Changed shortcut to `Ctrl/cmd + Shift + =` due to conflict with previous

### 0.0.1

- Initial release: toggle selected wikilink to markdown link and vice versa
