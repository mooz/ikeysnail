const { dispatchKeys, evalScript } = require("./key-remap");

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

function marked(key) {
  return function() {
    dispatchKeys(key, false, true);
  };
}

const baseEmacsKeymap = {
  // We prefer \ instead of ¥, right?
  "¥": () => evalScript(`jsbox.insertText('\\\\');`),

  UIKeyInputRightArrow: marked("RIGHT"),
  UIKeyInputLeftArrow: marked("LEFT"),
  UIKeyInputDownArrow: marked("DOWN"),
  UIKeyInputUpArrow: marked("UP"),
  "shift-UIKeyInputRightArrow": marked("shift-RIGHT"),
  "shift-UIKeyInputLeftArrow": marked("shift-LEFT"),
  "shift-UIKeyInputDownArrow": marked("shift-DOWN"),
  "shift-UIKeyInputUpArrow": marked("shift-UP"),

  "command-<": marked("ctrl-home"),
  "command-.": marked("ctrl-end"),

  "ctrl-p": marked("UP"),
  "ctrl-n": marked("DOWN"),
  "ctrl-f": marked("RIGHT"),
  "ctrl-b": marked("LEFT"),

  "ctrl-a": marked("home"),
  "ctrl-e": marked("end"),

  "ctrl-d": "delete",
  "ctrl-i": "tab",
  "ctrl-t": "ctrl-t",

  "ctrl-v": marked("page_down"),
  "command-v": marked("page_up"),

  "ctrl-y": async () => {
    evalScript(`jsbox.insertText('${escape($clipboard.text)}', true)`);
  },
  "ctrl-k": async () => {
    await dispatchKeys("shift-end", true, true);
    const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
    await dispatchKeys("back_space", true);
    $clipboard.set({ type: "public.plain-text", value: selectedText });
  },
  "ctrl-w": async () => {
    const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
    await dispatchKeys("back_space", true);
    $clipboard.set({ type: "public.plain-text", value: selectedText });
  },
  "command-w": async () => {
    const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
    $clipboard.set({ type: "public.plain-text", value: selectedText });
  },
  "ctrl-c": async () => {
    const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
    $clipboard.set({ type: "public.plain-text", value: selectedText });
    await dispatchKeys("back_space", true);
  },

  "ctrl-l": () => {
    evalScript(`jsbox.recenter()`);
  },

  "command-f": marked("ctrl-RIGHT"),
  "command-b": marked("ctrl-LEFT"),
  "command-d": marked("ctrl-delete"),

  "ctrl- ": () => {
    evalScript(`jsbox.setMark()`);
  },

  "ctrl-_": "command-z",
  "ctrl-z": "command-z",
  "ctrl-g": "escape",
  "ctrl-r": "ctrl-shift-k",
  "command-s": "ctrl-h"
};

// Scrapbox
const scrapboxKeyMap = {
  "command-f": marked("ALT-RIGHT"),
  "command-b": marked("ALT-LEFT"),
  "command-d": ["shift-ALT-RIGHT", "back_space"],
  "ctrl-UIKeyInputRightArrow": "ctrl-RIGHT",
  "ctrl-UIKeyInputLeftArrow": "ctrl-LEFT",
  "ctrl-UIKeyInputDownArrow": "ctrl-DOWN",
  "ctrl-UIKeyInputUpArrow": "ctrl-UP",
  // "ctrl-k": "ctrl-k",
  // "ctrl-y": "ctrl-y",
  "ctrl-t": "ctrl-t",
  "ctrl-i": "ctrl-i"
};

// Overleaf (ACE Editor)
const overleafKeyMap = {
    "ctrl-h": () => dispatchKeys("back_space")
};

// HackMD (CodeMirror)
const hackmdKeyMap = {};

module.exports = {
  baseEmacsKeymap,
  scrapboxKeyMap,
  overleafKeyMap,
  hackmdKeyMap
};
