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
    "meta-x": keysnail.command(
      () => keysnail.showKeyHelp(),
      "M-x (Show key help and commands)"
    ),
    "meta-w": keysnail.command(
      () => keysnail.copyRegion(),
      "Copy selected text"
    ),
    "ctrl-meta-j": keysnail.command(
      () => $notify("selectNextTab"),
      "Select next tab"
    ),
    "ctrl-meta-k": keysnail.command(
      () => $notify("selectPreviousTab"),
      "Select previous tab"
    ),
    "ctrl-Tab": keysnail.command(
      () => $notify("selectNextTab"),
      "Select next tab"
    ),
    "ctrl-shift-Tab": keysnail.command(
      () => $notify("selectPreviousTab"),
      "Select previous tab"
    ),
    "meta-l": keysnail.command(
      () => $notify("focusLocationBar"),
      "Focus to the location bar"
    ),
    "ctrl-l": keysnail.command(
      () => $notify("focusLocationBar"),
      "Focus to the location bar"
    ),
    "meta-t": keysnail.command(() => $notify("createNewTab"), "Create a new tab"),
    "ctrl-t": keysnail.command(() => $notify("createNewTab"), "Create a new tab"),
    "ctrl-meta-g": keysnail.command(
      () => $notify("openClipboardURL"),
      "Open clipboard URL"
    ),
    "ctrl-x": {
      k: keysnail.command(() => $notify("closeTab"), "Close current tab"),
      u: keysnail.command("meta-z", "Undo")
     ,
    },
    "meta-f": keysnail.command(() => $notify("searchText"), "Search text (forward)"),
    "ctrl-s": keysnail.command(() => $notify("searchText"), "Search text (forward)"),
    "ctrl-r": keysnail.command(() => $notify("searchText", { backward: true }), "Search text (backward)"),
  },
  rich: {
    "meta-x": keysnail.command(() => keysnail.showKeyHelp(["rich", "all"]), "M-x (Show key help and commands)"),
    "ctrl-g": keysnail.command(() => keysnail.escape(), "Cancel (Quit key)"),
    Escape: keysnail.command(() => keysnail.escape(), "Escape from the editor"),
    "¥": keysnail.command(() => keysnail.insertText("\\"), "Insert backslash"),
    "ctrl- ": keysnail.marked(() => keysnail.setMark(), "Set mark"),
    "ctrl-@": keysnail.marked(() => keysnail.setMark(), "Set mark"),
    "ctrl-l": keysnail.marked(() => keysnail.recenter(), "Recenter cursor"),
    "meta-f": keysnail.marked("ctrl-ArrowRight", "Forward word"),
    "meta-b": keysnail.marked("ctrl-ArrowLeft", "Backward word"),
    "meta-d": keysnail.marked("ctrl-Delete", "Delete forward word"),
    "ctrl-_": keysnail.command("meta-z", "Undo"),
    "ctrl-z": keysnail.command("meta-z", "Undo"),
    "ctrl-s": keysnail.command("meta-f", "Search text (forward)"),
    "ctrl-h": keysnail.command("Backspace", "Delete backward char"),
    "ctrl-r": keysnail.command("ctrl-shift-k", "Search text (backward)"),
    "meta-s": keysnail.command("ctrl-h", "???"),
    "shift-ArrowRight": keysnail.marked("shift-ArrowRight", ""),
    "shift-ArrowLeft": keysnail.marked("shift-ArrowLeft", ""),
    "shift-ArrowDown": keysnail.marked("shift-ArrowDown", ""),
    "shift-ArrowUp": keysnail.marked("shift-ArrowUp", ""),
    ArrowRight: keysnail.marked("ArrowRight", ""),
    ArrowLeft: keysnail.marked("ArrowLeft", ""),
    ArrowDown: keysnail.marked("ArrowDown", ""),
    ArrowUp: keysnail.marked("ArrowUp", ""),
    "meta-,": keysnail.marked("ctrl-Home", ""),
    "meta-.": keysnail.marked("ctrl-End", ""),
    "ctrl-p": keysnail.marked("ArrowUp", "Previous line"),
    "ctrl-n": keysnail.marked("ArrowDown", "Next line"),
    "ctrl-f": keysnail.marked("ArrowRight", "Forward character"),
    "ctrl-b": keysnail.marked("ArrowLeft", "Backward character"),
    "ctrl-a": keysnail.marked("Home", "Beginning of the line"),
    "ctrl-e": keysnail.marked("End", "End of the line"),
    "ctrl-d": keysnail.command("Delete", "Delete forward char"),
    "ctrl-i": keysnail.command("Tab", "Indent"),
    "ctrl-m": keysnail.command("Enter", "New line"),
    "ctrl-v": keysnail.marked("PageDown", "Scroll page down"),
    "meta-v": keysnail.marked("PageUp", "Scroll page up"),
    "ctrl-y": keysnail.command(() => keysnail.paste(), "Paste (Yank)"),
    "ctrl-k": keysnail.command(() => keysnail.killLine(), "Kill line"),
    "ctrl-w": keysnail.command(() => keysnail.killRegion(), "Kill region"),
  },
  edit: {
    "meta-x": keysnail.command(() => keysnail.showKeyHelp(["edit", "all"]), "M-x"),
    "ctrl-g": keysnail.command(() => keysnail.escape(), "Cancel (Quit key)"),
    Escape: keysnail.command(() => keysnail.escape(), "Escape"),
    "¥": keysnail.command(() => keysnail.insertText("\\"), "Insert backslash"),
    "ctrl-p": "ArrowUp",
    "ctrl-n": "ArrowDown",
    "meta-f": null,
  },
  view: {
    "?": keysnail.command(() => keysnail.showKeyHelp(), "Show all shortcut keys"),
    d: {
      d: keysnail.command(() => $notify("closeTab"), "Close current tab"),
    },
    ":": keysnail.command(() => keysnail.runEvalConsole(), "JavaScript Console (Eval)"),
    o: keysnail.command(() => $notify("focusLocationBar"), "Focus to the location bar"),
    "ctrl-a": keysnail.command(() => $notify("selectTabsByPanel"), "Select tabs by panel"),
    E: keysnail.command(() => keysnail.toggleHitHint(true), "Open a link by hints (background tab)"),
    e: keysnail.command(() => keysnail.toggleHitHint(), "Open a link by hints"),
    Escape: keysnail.command(() => keysnail.escape(), "Escape"),
    "ctrl-g": keysnail.command(() => keysnail.escape(), "Cancel (Quite)"),
    y: {
      y: keysnail.command(() => {
        $notify("copyText", { text: location.href });
        message("Copied: " + location.href);
      }, "Copy URL of the current page"),
    },
    u: keysnail.command(() => $notify("undoClosedTab"), "Undo closed tab"),
    p: keysnail.command(() => $notify("openClipboardURL"), "Open clipboard URL"),
    r: keysnail.command(() => location.reload(), "Reload page"),
    i: keysnail.command(() => keysnail.focusEditor(), "Focus to the (rich) text editor"),
    j: keysnail.command(() => keysnail.scrollDown(), "Scroll down"),
    k: keysnail.command(() => keysnail.scrollUp(), "Scroll up"),
    s: keysnail.command(() => $notify("scrap"), "Scrap this page (Scrapbox)"),
    S: keysnail.command(() => $notify("share"), "Share this page"),
    l: keysnail.command(() => $notify("selectNextTab"), "Select next tab"),
    h: keysnail.command(() => $notify("selectPreviousTab"), "Select previous tab"),
    " ": keysnail.command(() => keysnail.scrollPageDown(), "Scroll page down"),
    b: keysnail.command(() => keysnail.scrollPageUp(), "Scroll page up"),
    B: keysnail.command(() => keysnail.back(), "History backward"),
    H: keysnail.command(() => keysnail.back(), "History backward"),
    F: keysnail.command(() => keysnail.forward(), "History forward"),
    L: keysnail.command(() => keysnail.forward(), "History backward"),
    f: keysnail.command(() => keysnail.focusFirstInput(), "Focus to the first input"),
    a: {
      a: keysnail.command(() => $notify("scrap"), "Scrap this page (Scrapbox)"),
      n: keysnail.command(() => $notify("gotoDailyNote"), "Goto daily note (Scrapbox)"),
    },
    g: {
      g: keysnail.command(() => keysnail.cursorTop(), "Goto the beginning of the page"),
      i: keysnail.command(() => keysnail.focusFirstInput(), "Focus to the first input"),
      e: keysnail.command(() => keysnail.focusEditor(), "Focus to the (rich text) editor"),
      t: keysnail.command(() => $notify("selectTabsByPanel"), "Select tabs by panel"),
    },
    G: keysnail.command(() => keysnail.cursorBottom(), "Goto the end of the page"),
    "ctrl-p": keysnail.command("ArrowUp", "Scroll up"),
    "ctrl-n": keysnail.command("ArrowDown", "Scroll down"),
    "ctrl-f": keysnail.command("ArrowRight", "Scroll right"),
    "ctrl-b": keysnail.command("ArrowLeft", "Scroll left"),
    "/": keysnail.command(() => $notify("searchText"), "Search text (forward)"),
    "meta-shift-t": keysnail.command(() => {
      $notify("createNewTab", {
        url: `https://translate.google.com/translate?hl=auto&sl=auto&&sandbox=1&u=${encodeURIComponent(
          location.href
        )}`,
      });
    }, "Translate the page"),
    q: keysnail.command(() => $notify("exitApplication"), "Exit ikeysnail"),
    "meta-i": keysnail.command(() => keysnail.startOutlineSelector(), "Show table of contents / outline of the page"),
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
