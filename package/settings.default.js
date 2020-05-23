config.DEBUG_SHOW_INPUT_KEY = false;
config.DEBUG_SHOW_DISPATCH_KEY = false;
config.DEBUG_SHOW_MESSAGE = false;

// Tab UI related settings
config.TAB_HEIGHT = 30;
config.TAB_VERTICAL = false;
config.TAB_VERTICAL_WIDTH = 250;
config.TAB_LAZY_LOADING = true;
config.SIZE_TAB_FONT = 13;
config.TOPBAR_HEIGHT = 50;

// Other UI related settings
config.HIDE_STATUSBAR = true;
config.HIDE_TOOLBAR = true;

// Auto key-repeating for alphabets and numbers
config.KEY_REPEAT_ENABLED = true;
config.KEY_REPEAT_INTERVAL = 0.03 * 1000;
config.KEY_REPEAT_INITIAL = 0.2 * 1000;

// Wether to swap command and option key (useful for non Mac keyboards)
config.SWAP_COMMAND_OPTION = false;

// Wether to capture ctrl-space key
config.CAPTURE_CTRL_SPACE = true;

// Specify your scrapbox account
config.SCRAPBOX_USER = null;

// Misc settings
config.NEW_PAGE_URL = "https://www.google.com/";
config.USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15";

if (!isContent) {
  // Configure order of location bar suggestion
  config.LOCATIONBAR_SUGGESTIONS = [
    "SuggestionTab",
    "SuggestionBookmark",
    "SuggestionHistory",
    "SuggestionScrapbox",
    "SuggestionWebQuery",
  ];
  config.LOCATIONBAR_SUGGESTIONS_SYNCED = false;
}

// --------------------------------------------------------------------------------
// Keymap
// --------------------------------------------------------------------------------

// Global Keymap. See for key syntax.
// https://developer.mozilla.org/ja/docs/Web/API/KeyboardEvent/key/Key_Values

config.globalKeyMap = {
  all: {
    "meta-w": () => keysnail.copyRegion(),
    ":": () => keysnail.runEvalConsole(),
    "ctrl-meta-j": () => $notify("selectNextTab"),
    "ctrl-meta-k": () => $notify("selectPreviousTab"),
    "ctrl-Tab": () => $notify("selectNextTab"),
    "ctrl-shift-Tab": () => $notify("selectPreviousTab"),
    "meta-l": () => $notify("focusLocationBar"),
    "ctrl-l": () => $notify("focusLocationBar"),
    "meta-t": () => $notify("createNewTab"),
    "ctrl-t": () => $notify("createNewTab"),
    "ctrl-meta-g": () => $notify("openClipboardURL"),
    "ctrl-x": {
      k: () => $notify("closeTab"),
      u: "meta-z",
    },
    "meta-f": () => $notify("searchText"),
    "ctrl-s": () => $notify("searchText"),
    "ctrl-r": () => $notify("searchText", { backward: true }),
  },
  rich: {
    "ctrl-g": () => keysnail.escape(),
    Escape: () => keysnail.escape(),
    "¥": () => keysnail.insertText("\\"),
    "ctrl- ": keysnail.marked(() => keysnail.setMark()),
    "ctrl-@": keysnail.marked(() => keysnail.setMark()),
    "ctrl-l": keysnail.marked(() => keysnail.recenter()),
    "meta-f": keysnail.marked("ctrl-ArrowRight"),
    "meta-b": keysnail.marked("ctrl-ArrowLeft"),
    "meta-d": keysnail.marked("ctrl-Delete"),
    "ctrl-_": "meta-z",
    "ctrl-z": "meta-z",
    "ctrl-s": "meta-f",
    "ctrl-h": "Backspace",
    "ctrl-r": "ctrl-shift-k",
    "meta-s": "ctrl-h",
    "shift-ArrowRight": keysnail.marked("shift-ArrowRight"),
    "shift-ArrowLeft": keysnail.marked("shift-ArrowLeft"),
    "shift-ArrowDown": keysnail.marked("shift-ArrowDown"),
    "shift-ArrowUp": keysnail.marked("shift-ArrowUp"),
    ArrowRight: keysnail.marked("ArrowRight"),
    ArrowLeft: keysnail.marked("ArrowLeft"),
    ArrowDown: keysnail.marked("ArrowDown"),
    ArrowUp: keysnail.marked("ArrowUp"),
    "meta-,": keysnail.marked("ctrl-Home"),
    "meta-.": keysnail.marked("ctrl-End"),
    "ctrl-p": keysnail.marked("ArrowUp"),
    "ctrl-n": keysnail.marked("ArrowDown"),
    "ctrl-f": keysnail.marked("ArrowRight"),
    "ctrl-b": keysnail.marked("ArrowLeft"),
    "ctrl-a": keysnail.marked("Home"),
    "ctrl-e": keysnail.marked("End"),
    "ctrl-d": "Delete",
    "ctrl-i": "Tab",
    "ctrl-m": "Enter",
    "ctrl-v": keysnail.marked("PageDown"),
    "meta-v": keysnail.marked("PageUp"),
    "ctrl-y": () => keysnail.paste(),
    "ctrl-k": () => keysnail.killLine(),
    "ctrl-w": () => keysnail.killRegion(),
  },
  edit: {
    "ctrl-g": () => keysnail.escape(),
    Escape: () => keysnail.escape(),
    "¥": () => keysnail.insertText("\\"),
    "ctrl-p": "ArrowUp",
    "ctrl-n": "ArrowDown",
    "meta-f": null,
  },
  view: {
    d: {
      d: () => $notify("closeTab"),
    },
    o: () => $notify("focusLocationBar"),
    "ctrl-a": () => $notify("selectTabsByPanel"),
    E: () => keysnail.toggleHitHint(true),
    e: () => keysnail.toggleHitHint(),
    Escape: () => keysnail.escape(),
    "ctrl-g": () => keysnail.escape(),
    y: {
      y: () => {
        $notify("copyText", { text: location.href });
        message("Copied: " + location.href);
      },
    },
    u: () => $notify("undoClosedTab"),
    p: () => $notify("openClipboardURL"),
    r: () => location.reload(),
    i: () => keysnail.focusEditor(),
    j: () => keysnail.scrollDown(),
    k: () => keysnail.scrollUp(),
    s: () => $notify("scrap"),
    S: () => $notify("share"),
    l: () => $notify("selectNextTab"),
    h: () => $notify("selectPreviousTab"),
    " ": () => keysnail.scrollPageDown(),
    b: () => keysnail.scrollPageUp(),
    B: () => keysnail.back(),
    F: () => keysnail.forward(),
    H: () => keysnail.back(),
    L: () => keysnail.forward(),
    f: () => keysnail.focusFirstInput(),
    g: {
      g: () => keysnail.cursorTop(),
      i: () => keysnail.focusFirstInput(),
      e: () => keysnail.focusEditor(),
      t: () => $notify("selectTabsByPanel"),
    },
    G: () => keysnail.cursorBottom(),
    "ctrl-p": "ArrowUp",
    "ctrl-n": "ArrowDown",
    "ctrl-f": "ArrowRight",
    "ctrl-b": "ArrowLeft",
    "ctrl-m": "Enter",
    "/": () => $notify("searchText"),
    "meta-t": () => {
      $notify("createNewTab", {
        url: `https://translate.google.com/translate?hl=auto&sl=auto&&sandbox=1&u=${encodeURIComponent(
          location.href
        )}`,
      });
    },
    q: () => $notify("exitApplication"),
    "meta-i": () => keysnail.startOutlineSelector(),
  },
};

// --------------------------------------------------------------------------------
// Keymap (System-level)
// --------------------------------------------------------------------------------

config.systemKeyMap = {
  all: {
    "ctrl-meta-j": (browser) => browser.selectNextTab(),
    "ctrl-meta-k": (browser) => browser.selectPreviousTab(),
    "meta-l": (browser) => browser.focusLocationBar(),
  },
  findBar: {
    "ctrl-m": (browser) => browser.findNext(),
    "ctrl-g": (browser) => browser.blurFindBar(),
    "ctrl-s": (browser) => browser.findNext(),
    "ctrl-r": (browser) => browser.findPrevious(),
    "ctrl-meta-j": (browser) => browser.selectNextTab(),
    "ctrl-meta-k": (browser) => browser.selectPreviousTab(),
    Escape: (browser) => browser.blurFindBar(),
  },
  urlBar: {
    "ctrl-p": (browser) => browser.selectLocationBarPreviousCandidate(),
    "ctrl-n": (browser) => browser.selectLocationBarNextCandidate(),
    "ctrl-m": (browser) => browser.decideLocationBarCandidate(),
    "ctrl-g": (browser) => browser.blurLocationBar(),
    "ctrl-meta-j": (browser) => browser.selectNextTab(),
    "ctrl-meta-k": (browser) => browser.selectPreviousTab(),
    Escape: (browser) => browser.blurLocationBar(),
  },
};

// --------------------------------------------------------------------------------
// Websites
// --------------------------------------------------------------------------------

config.sites.push({
  alias: "Google",
  url: "https://www.google.com",
});

const GDOCS_KEYMAP = {
  rich: {
    "meta-f": keysnail.marked("alt-ArrowRight"),
    "meta-b": keysnail.marked("alt-ArrowLeft"),
    "meta-d": keysnail.marked("alt-Delete"),
    "ctrl-_": "ctrl-z",
    "ctrl-z": "meta-z",
    "ctrl-s": "ctrl-f",
  },
};

config.sites.push({
  alias: "Google Docs",
  url: "https://docs.google.com/",
  keymap: GDOCS_KEYMAP,
});

config.sites.push({
  alias: "Google Docs (Slide)",
  url: "https://docs.google.com/presentation/",
  keymap: GDOCS_KEYMAP,
});

config.sites.push({
  alias: "OverLeaf",
  url: "https://www.overleaf.com/project/",
  style: `
.toolbar { font-size: small !important; }
.entity { font-size: small !important; }
`,
});

config.sites.push({
  alias: "Scrapbox",
  url: "https://scrapbox.io/",
  keymap: {
    rich: {
      "meta-f": keysnail.marked("alt-ArrowRight"),
      "meta-b": keysnail.marked("alt-ArrowLeft"),
      "meta-d": () => {
        keysnail.dispatchKey("alt-shift-ArrowRight");
        keysnail.dispatchKey("Backspace");
      },
      "ctrl-i": "ctrl-i",
      "ctrl-t": "ctrl-t",
      "ctrl-c": {
        ".": () => {
          keysnail.insertText(new Date());
        },
        "ctrl-c": () => {
          // Toggle TODO
          keysnail.dispatchKey("Home");
          keysnail.dispatchKey("shift-End");
          const text = keysnail.getSelectedText();
          let replacedText = "";
          const todoPattern = /\[(?:TODO|DONE)\] /;
          if (todoPattern.test(text)) {
            replacedText = text.replace(todoPattern, (match) =>
              match === "[TODO] " ? "[DONE] " : ""
            );
          } else {
            let matched = text.match(/^([ \t]*)(.*)/);
            replacedText = matched[1] + "[TODO] " + matched[2];
          }
          keysnail.dispatchKey("Backspace");
          keysnail.insertText(replacedText);
        },
      },
    },
  },
  style: `
#editor {
  caret-color: transparent !important;
}
`,
});

config.sites.push({
  alias: "HackMD",
  url: "https://hackmd.io/",
  style: `
.CodeMirror {
  caret-color: transparent !important;
}
`,
});
