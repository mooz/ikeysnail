const setup = (config, keysnail) => {
  config.DEBUG_SHOW_INPUT_KEY = false;
  config.DEBUG_SHOW_DISPATCH_KEY = false;
  config.DEBUG_SHOW_MESSAGE = false;

  config.TAB_VERTICAL = false;
  config.TAB_VERTICAL_WIDTH = 200;

  config.CAPTURE_CTRL_SPACE = true;
  config.HIDE_STATUSBAR = true;
  config.HIDE_TOOLBAR = true;
  config.NEW_PAGE_URL = "https://www.google.com/";
  config.USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15";

  // See
  // https://developer.mozilla.org/ja/docs/Web/API/KeyboardEvent/key/Key_Values

  config.globalKeyMap = {
    all: {
      "meta-w": () => keysnail.copyRegion(),
      "ctrl-K": () => keysnail.launchDebugConsole(),
      "ctrl-meta-j": () => $notify("selectNextTab"),
      "ctrl-meta-k": () => $notify("selectPreviousTab"),
      "ctrl-Tab": () => $notify("selectNextTab"),
      "ctrl-shift-Tab": () => $notify("selectPreviousTab"),
      "meta-l": () => $notify("focusLocationBar"),
      "ctrl-l": () => $notify("focusLocationBar"),
      "meta-t": () => $notify("createNewTab"),
      "ctrl-t": () => $notify("createNewTab")
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
      "ctrl-x": "ctrl-x",
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
      "ctrl-w": () => keysnail.killRegion()
    },
    edit: {
      "ctrl-g": () => keysnail.escape(),
      Escape: () => keysnail.escape(),
      "¥": () => keysnail.insertText("\\"),
      "ctrl-p": "ArrowUp",
      "ctrl-n": "ArrowDown"
    },
    view: {
      d: () => $notify("closeTab"),
      o: () => keysnail.startSiteSelector(),
      e: () => keysnail.toggleHitHint(),
      Escape: () => keysnail.escape(),
      "ctrl-g": () => keysnail.escape(),
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
      H: () => keysnail.back(),
      F: () => keysnail.forward(),
      f: () => keysnail.focusFirstInput(),
      g: () => keysnail.cursorTop(),
      G: () => keysnail.cursorBottom(),
      "ctrl-p": "ArrowUp",
      "ctrl-n": "ArrowDown",
      "ctrl-f": "ArrowRight",
      "ctrl-b": "ArrowLeft",
      "ctrl-m": "Enter",
      q: () => $notify("exitApplication")
    }
  };

  config.sites.push({
    alias: "Google",
    url: "https://www.google.com"
  });

  const GDOCS_KEYMAP = {
    rich: {
      "meta-f": keysnail.marked("alt-ArrowRight"),
      "meta-b": keysnail.marked("alt-ArrowLeft"),
      "meta-d": keysnail.marked("alt-Delete"),
      "ctrl-_": "ctrl-z",
      "ctrl-z": "meta-z",
      "ctrl-s": "ctrl-f"
    }
  };

  config.sites.push({
    alias: "Google Docs",
    url: "https://docs.google.com/",
    keymap: GDOCS_KEYMAP
  });

  config.sites.push({
    alias: "Google Docs (Slide)",
    url: "https://docs.google.com/presentation/",
    keymap: GDOCS_KEYMAP
  });

  config.sites.push({
    alias: "OverLeaf",
    url: "https://www.overleaf.com/project/",
    style: `
.toolbar { font-size: small !important; }
.entity { font-size: small !important; }
`
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
        "ctrl-t": "ctrl-t"
      }
    },
    style: `
#editor {
  caret-color: transparent !important;
}
`
  });

  config.sites.push({
    alias: "HackMD",
    url: "https://hackmd.io/",
    style: `
.CodeMirror {
  caret-color: transparent !important;
}
`
  });
};

if (typeof exports !== "undefined") {
  exports.setup = setup;
}
