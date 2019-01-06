const {dispatchKeys, evalScript} = require("./scripts/key-remap");

const baseEmacsKeymap = {
    "UIKeyInputRightArrow": "RIGHT",
    "UIKeyInputLeftArrow": "LEFT",
    "UIKeyInputDownArrow": "DOWN",
    "UIKeyInputUpArrow": "UP",
    "shift-UIKeyInputRightArrow": "shift-RIGHT",
    "shift-UIKeyInputLeftArrow": "shift-LEFT",
    "shift-UIKeyInputDownArrow": "shift-DOWN",
    "shift-UIKeyInputUpArrow": "shift-UP",

    "ctrl-p": "UP",
    "ctrl-n": "DOWN",
    "ctrl-f": "RIGHT",
    "ctrl-b": "LEFT",

    "ctrl-a": "home",
    "ctrl-e": "end",

    "ctrl-d": "delete",
    "ctrl-i": "tab",
    "ctrl-t": "ctrl-t",

    "ctrl-v": "page_down",
    "command-v": "page_up",

    "ctrl-k": async () => {
        await dispatchKeys("shift-end", true);
        const selectedText = await evalScript(`window.getSelection().toString()`, true);
        await dispatchKeys("back_space", true);
        $clipboard.set({"type": "public.plain-text", "value": selectedText});
    },

    "ctrl-w": async () => {
        const selectedText = await evalScript(`window.getSelection().toString()`, true);
        await dispatchKeys("back_space", true);
        $clipboard.set({"type": "public.plain-text", "value": selectedText});
    },

    "command-f": "ctrl-RIGHT",
    "command-b": "ctrl-LEFT",
    "command-d": "ctrl-delete",

    "ctrl-_": "ctrl-z",
    "ctrl-z": "ctrl-z",
    "ctrl-s": "ctrl-f",
    "ctrl-g": "escape",
    "ctrl-r": "ctrl-shift-k",
    "command-s": "ctrl-h",
};

// Scrapbox
const scrapboxKeyMap = {
    "command-f": "ALT-RIGHT",
    "command-b": "ALT-LEFT",
    "ctrl-k": "ctrl-k",
    "ctrl-y": "ctrl-y",
    "ctrl-w": "ctrl-w",
};

const overleafKeyMap = {
    "¥": () => {
        evalScript(`jsbox.insertText('\\\\');`);
    },
    "ctrl-k": async () => {
        await dispatchKeys("shift-end", true);
        const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
        await dispatchKeys("back_space", true);
        $clipboard.set({"type": "public.plain-text", "value": selectedText});
    },
    "ctrl-w": async () => {
        const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
        await dispatchKeys("back_space", true);
        $clipboard.set({"type": "public.plain-text", "value": selectedText});
    },
    "meta-w": async () => {
        const selectedText = await evalScript(`jsbox.getSelectedText()`, true);
        $clipboard.set({"type": "public.plain-text", "value": selectedText});
    },
    "ctrl-y": async () => {
        evalScript(`jsbox.insertText('${escape($clipboard.text)}', true)`);
    },
    "ctrl-l": () => {
      evalScript(`jsbox.recenter()`);
  },
};

module.exports = { baseEmacsKeymap, scrapboxKeyMap, overleafKeyMap };
