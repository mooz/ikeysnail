const {dispatchKeys, evalScript} = require("./key-remap");

const baseEmacsKeymap = {
    // We prefer \ instead of ¥, right?
    "¥": () => evalScript(`jsbox.insertText('\\\\');`),

    "UIKeyInputRightArrow": "RIGHT",
    "UIKeyInputLeftArrow": "LEFT",
    "UIKeyInputDownArrow": "DOWN",
    "UIKeyInputUpArrow": "UP",
    "shift-UIKeyInputRightArrow": "shift-RIGHT",
    "shift-UIKeyInputLeftArrow": "shift-LEFT",
    "shift-UIKeyInputDownArrow": "shift-DOWN",
    "shift-UIKeyInputUpArrow": "shift-UP",

    "command-<": "ctrl-home",

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

    "ctrl-y": async () => {
        evalScript(`jsbox.insertText('${escape($clipboard.text)}', true)`);
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

    "ctrl-l": () => {
        evalScript(`jsbox.recenter()`);
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
    "command-d": ["shift-ALT-RIGHT", "back_space"],
    "ctrl-k": "ctrl-k",
    "ctrl-y": "ctrl-y",
    "ctrl-w": "ctrl-w",
};

// Overleaf (ACE Editor)
const overleafKeyMap = {
    "ctrl-h": () => dispatchKeys("back_space")
};

// HackMD (CodeMirror)
const hackmdKeyMap = {};

module.exports = {baseEmacsKeymap, scrapboxKeyMap, overleafKeyMap, hackmdKeyMap};
