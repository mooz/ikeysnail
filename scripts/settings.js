let sites = [];

function marked(command) {
  return { command: command, marked: true };
}

function defineSite(url, keymap, alias, style) { 
  sites.push({ url, keymap, alias, style });
}

let globalKeyMap = {
  rich: {
    "ctrl-g": () => jsbox.escape(),
    Escape: () => jsbox.escape(),
    "¥": () => jsbox.insertText("\\"),
    "ctrl-l": marked(() => jsbox.recenter()),
    "ctrl- ": marked(() => jsbox.setMark()),
    "meta-f": marked("ctrl-RIGHT"),
    "meta-b": marked("ctrl-LEFT"),
    "meta-d": marked("ctrl-delete"),
    "ctrl-x": "ctrl-x",
    "ctrl-_": "meta-z",
    "ctrl-z": "meta-z",
    "ctrl-s": "meta-f",
    "ctrl-h": "back_space",
    "ctrl-r": "ctrl-shift-k",
    "meta-s": "ctrl-h",
    "shift-ArrowRight": marked("shift-right"),
    "shift-ArrowLeft": marked("shift-left"),
    "shift-ArrowDown": marked("shift-down"),
    "shift-ArrowUp": marked("shift-up"),
    ArrowRight: marked("right"),
    ArrowLeft: marked("left"),
    ArrowDown: marked("down"),
    ArrowUp: marked("up"),
    "meta-,": marked("ctrl-home"),
    "meta-.": marked("ctrl-end"),
    "ctrl-p": marked("up"),
    "ctrl-n": marked("down"),
    "ctrl-f": marked("right"),
    "ctrl-b": marked("left"),
    "ctrl-a": marked("home"),
    "ctrl-e": marked("end"),
    "ctrl-d": "delete",
    "ctrl-i": "tab",
    "ctrl-m": "return",
    "ctrl-v": marked("page_down"),
    "command-v": marked("page_up"),
    "ctrl-y": () => jsbox.paste(),
    "ctrl-k": () => jsbox.killLine(),
    "ctrl-w": () => jsbox.killRegion(),
    "command-w": () => jsbox.copyRegion()
  },
  edit: {
    "ctrl-g": () => jsbox.escape(),
    Escape: () => jsbox.escape(),
    "¥": () => jsbox.insertText("\\"),
    "ctrl-p": "up",
    "ctrl-n": "down"
  },
  view: {
    o: () => jsbox.startSiteSelector(),
    e: () => jsbox.toggleHitHint(),
    Escape: () => jsbox.escape(),
    "ctrl-g": () => jsbox.escape(),
    i: () => jsbox.focusEditor(),
    j: () => jsbox.scrollDown(),
    k: () => jsbox.scrollUp(),
    " ": () => jsbox.scrollPageDown(),
    b: () => jsbox.scrollPageUp(),
    B: () => jsbox.back(),
    H: () => jsbox.back(),
    F: () => jsbox.forward(),
    f: () => jsbox.focusFirstInput(),
    g: () => jsbox.cursorTop(),
    G: () => jsbox.cursorBottom(),
    "ctrl-p": "up",
    "ctrl-n": "down",
    "ctrl-f": "right",
    "ctrl-b": "left",
    "ctrl-m": "enter"
  }
};

defineSite(
  "https://www.overleaf.com/project/",
  {},
  "OverLeaf",
  `
.toolbar { font-size: small !important; }
.entity { font-size: small !important; }
`
);

defineSite(
  "https://scrapbox.io/",
  {
    rich: {
      "meta-f": marked("ALT-RIGHT"),
      "meta-b": marked("ALT-LEFT")
    }
  },
  "Scrapbox",
  `
#editor {
  caret-color: transparent !important;
}
`
);

defineSite(
  "https://hackmd.io/",
  {},
  "HackMD",
  `
.CodeMirror {
  caret-color: transparent !important;
}
`
);

defineSite("https://www.google.com", {}, "Google", ``);
defineSite(
  "https://docs.google.com/",
  {
    rich: {
      "meta-f": marked("alt-RIGHT"),
      "meta-b": marked("alt-LEFT"),
      "meta-d": marked("alt-delete"),
      "ctrl-_": "ctrl-z",
      "ctrl-z": "meta-z",
      b: "meta-y",
      "ctrl-s": "ctrl-f"
    }
  },
  "Google Docs (Slide)",
  ``
);

exports.sites = sites;
