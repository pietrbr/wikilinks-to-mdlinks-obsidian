import { Editor, Notice, Plugin } from "obsidian";

export default class WikilinksToMdlinks extends Plugin {
  onload() {
    console.log("loading wikilinks-to-mdlinks plugin...");

    this.addCommand({
      id: "toggle-wiki-md-links",
      name: "Toggle selected wikilink to markdown link and vice versa",
      editorCallback: (editor: Editor) => {
        this.toggleLink(editor);
      },
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "L",
        },
      ],
    });
  }

  onunload() {
    console.log("unloading wikilinks-to-mdlinks plugin");
  }

  toggleLink(editor: Editor) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);

    // Skip if cursor is in YAML frontmatter
    if (editor.getLine(0) === "---") {
      for (let i = 1; i < editor.lineCount(); i++) {
        if (editor.getLine(i) === "---") {
          if (cursor.line <= i) return;
          break;
        }
      }
    }

    // Skip if cursor is inside a fenced code block
    let codeDepth = 0;
    for (let i = 0; i < cursor.line; i++) {
      if (/^(?:```|~~~)/.test(editor.getLine(i))) codeDepth ^= 1;
    }
    if (codeDepth === 1 || /^(?:```|~~~)/.test(line)) return;

    const regexHasExtension = /^([^\\]*)\.(\w+)$/;

    // Captures target and optional alias: [[target]] or [[target|alias]]
    const regexWiki = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/;
    const regexWikiGlobal = /\[\[([^\]]*)\]\]/g;
    const regexMdGlobal = /\[([^\]]*)\]\(([^\)]*)\)/g;

    const wikiMatches = line.match(regexWikiGlobal);
    const mdMatches = line.match(regexMdGlobal);

    let ifFoundMatch = false;

    // If there are wikiMatches find if the cursor is inside the selected text
    let i = 0;
    if (wikiMatches) {
      for (const item of wikiMatches) {
        const temp = line.slice(i, line.length);
        const index = i + temp.indexOf(item);
        const indexEnd = index + item.length;
        i = indexEnd;

        if (cursor.ch >= index && cursor.ch <= indexEnd) {
          ifFoundMatch = true;
          const wikiMatch = item.match(regexWiki);
          const target = wikiMatch[1];
          const alias = wikiMatch[2];

          // Separate heading anchor from filename before processing
          const anchorIdx = target.indexOf("#");
          const base = anchorIdx >= 0 ? target.slice(0, anchorIdx) : target;
          const anchor = anchorIdx >= 0 ? target.slice(anchorIdx) : "";

          // Build URL: add .md to base only if it has no extension
          const hasExt = base.match(regexHasExtension);
          const urlPath = (hasExt ? base : base + ".md") + anchor;
          const encodedPath = encodeURI(urlPath);

          // Display text: alias if present, otherwise the full target (with anchor)
          const displayText = alias !== undefined ? alias : target;

          editor.replaceRange(
            `[${displayText}](${encodedPath})`,
            { line: cursor.line, ch: index },
            { line: cursor.line, ch: indexEnd },
          );
        }
      }
    }

    i = 0;
    if (!ifFoundMatch) {
      if (mdMatches) {
        for (const item of mdMatches) {
          const temp = line.slice(i, line.length);
          const index = i + temp.indexOf(item);
          const indexEnd = index + item.length;
          i = indexEnd;

          if (cursor.ch >= index && cursor.ch <= indexEnd) {
            ifFoundMatch = true;
            const mdMatch = item.match(/^\[([^\]]*)\]\(([^\)]*)\)$/);
            const displayText = mdMatch[1];
            let wikiTarget = decodeURI(mdMatch[2]);

            // Skip external URLs (http://, https://, ftp://, etc.)
            if (/^[a-z][a-z\d+\-.]*:\/\//i.test(wikiTarget)) {
              new Notice("External URLs cannot be converted to wikilinks");
              return;
            }

            // Separate heading anchor before stripping extension
            const anchorIdx = wikiTarget.indexOf("#");
            const anchor = anchorIdx >= 0 ? wikiTarget.slice(anchorIdx) : "";
            const baseUrl =
              anchorIdx >= 0 ? wikiTarget.slice(0, anchorIdx) : wikiTarget;

            // Strip .md from base filename only
            const extMatch = baseUrl.match(regexHasExtension);
            const wikiBase =
              extMatch && extMatch[2] === "md" ? extMatch[1] : baseUrl;
            wikiTarget = wikiBase + anchor;

            // Use alias syntax only when display text differs from target
            const newItem =
              displayText !== wikiTarget
                ? `[[${wikiTarget}|${displayText}]]`
                : `[[${wikiTarget}]]`;

            editor.replaceRange(
              newItem,
              { line: cursor.line, ch: index },
              { line: cursor.line, ch: indexEnd },
            );
          }
        }
      }
    }

    if (!ifFoundMatch) {
      new Notice("No link found at cursor");
    }
  }
}
