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
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "L" }],
    });

    this.addCommand({
      id: "convert-all-to-md-links",
      name: "Convert all wikilinks in file to markdown links",
      editorCallback: (editor: Editor) => {
        this.convertAll(editor, "toMd");
      },
    });

    this.addCommand({
      id: "convert-all-to-wiki-links",
      name: "Convert all markdown links in file to wikilinks",
      editorCallback: (editor: Editor) => {
        this.convertAll(editor, "toWiki");
      },
    });
  }

  onunload() {
    console.log("unloading wikilinks-to-mdlinks plugin");
  }

  convertAll(editor: Editor, direction: "toMd" | "toWiki") {
    const regexHasExtension = /^([^\\]*)\.(\w+)$/;
    let inFrontmatter = false;
    let codeDepth = 0;
    let count = 0;

    const lineCount = editor.lineCount();
    for (let lineNum = 0; lineNum < lineCount; lineNum++) {
      const line = editor.getLine(lineNum);

      // Track YAML frontmatter
      if (lineNum === 0 && line === "---") {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        if (line === "---") inFrontmatter = false;
        continue;
      }

      // Track fenced code blocks
      if (/^(?:```|~~~)/.test(line)) {
        codeDepth ^= 1;
        continue;
      }
      if (codeDepth > 0) continue;

      let newLine: string;

      if (direction === "toMd") {
        newLine = line.replace(
          /(!?)\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g,
          (_, bang, target, alias) => {
            const anchorIdx = target.indexOf("#");
            const base = anchorIdx >= 0 ? target.slice(0, anchorIdx) : target;
            const anchor = anchorIdx >= 0 ? target.slice(anchorIdx) : "";
            const hasExt = regexHasExtension.test(base);
            const urlPath = (hasExt ? base : base + ".md") + anchor;
            const displayText = alias !== undefined ? alias : target;
            count++;
            return `${bang}[${displayText}](${encodeURI(urlPath)})`;
          },
        );
      } else {
        newLine = line.replace(
          /(!?)\[([^\]]*)\]\(([^\)]*)\)/g,
          (match, bang, displayText, urlRaw) => {
            const wikiTarget = decodeURI(urlRaw);
            if (/^[a-z][a-z\d+\-.]*:\/\//i.test(wikiTarget)) return match;

            const anchorIdx = wikiTarget.indexOf("#");
            const anchor = anchorIdx >= 0 ? wikiTarget.slice(anchorIdx) : "";
            const baseUrl =
              anchorIdx >= 0 ? wikiTarget.slice(0, anchorIdx) : wikiTarget;
            const extMatch = baseUrl.match(regexHasExtension);
            const wikiBase =
              extMatch && extMatch[2] === "md" ? extMatch[1] : baseUrl;
            const target = wikiBase + anchor;
            count++;
            return displayText !== target
              ? `${bang}[[${target}|${displayText}]]`
              : `${bang}[[${target}]]`;
          },
        );
      }

      if (newLine !== line) {
        editor.replaceRange(
          newLine,
          { line: lineNum, ch: 0 },
          { line: lineNum, ch: line.length },
        );
      }
    }

    new Notice(
      count > 0
        ? `Converted ${count} link${count > 1 ? "s" : ""}`
        : "No links found",
    );
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
    const regexWiki = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/;
    const regexWikiGlobal = /!?\[\[([^\]]*)\]\]/g;
    const regexMdGlobal = /!?\[([^\]]*)\]\(([^\)]*)\)/g;

    const wikiMatches = line.match(regexWikiGlobal);
    const mdMatches = line.match(regexMdGlobal);

    let ifFoundMatch = false;

    let i = 0;
    if (wikiMatches) {
      for (const item of wikiMatches) {
        const temp = line.slice(i, line.length);
        const index = i + temp.indexOf(item);
        const indexEnd = index + item.length;
        i = indexEnd;

        if (cursor.ch >= index && cursor.ch <= indexEnd) {
          ifFoundMatch = true;
          const bang = item.startsWith("!") ? "!" : "";
          const wikiMatch = item.match(regexWiki);
          const target = wikiMatch[1];
          const alias = wikiMatch[2];

          const anchorIdx = target.indexOf("#");
          const base = anchorIdx >= 0 ? target.slice(0, anchorIdx) : target;
          const anchor = anchorIdx >= 0 ? target.slice(anchorIdx) : "";
          const hasExt = base.match(regexHasExtension);
          const urlPath = (hasExt ? base : base + ".md") + anchor;
          const encodedPath = encodeURI(urlPath);
          const displayText = alias !== undefined ? alias : target;

          editor.replaceRange(
            `${bang}[${displayText}](${encodedPath})`,
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
            const mdMatch = item.match(/^(!?)\[([^\]]*)\]\(([^\)]*)\)$/);
            const bang = mdMatch[1];
            const displayText = mdMatch[2];
            let wikiTarget = decodeURI(mdMatch[3]);

            if (/^[a-z][a-z\d+\-.]*:\/\//i.test(wikiTarget)) {
              new Notice("External URLs cannot be converted to wikilinks");
              return;
            }

            const anchorIdx = wikiTarget.indexOf("#");
            const anchor = anchorIdx >= 0 ? wikiTarget.slice(anchorIdx) : "";
            const baseUrl =
              anchorIdx >= 0 ? wikiTarget.slice(0, anchorIdx) : wikiTarget;
            const extMatch = baseUrl.match(regexHasExtension);
            const wikiBase =
              extMatch && extMatch[2] === "md" ? extMatch[1] : baseUrl;
            wikiTarget = wikiBase + anchor;

            const newItem =
              displayText !== wikiTarget
                ? `${bang}[[${wikiTarget}|${displayText}]]`
                : `${bang}[[${wikiTarget}]]`;

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
