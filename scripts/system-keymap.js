const { dispatchKeys, evalScript } = require("./system-remap");

// Cocoa-level keymap
const systemKeymap = {
  "ctrl-o": () => {
    evalScript(`alert("hoge"); jsbox.setMark()`);
  },
  "ctrl- ": () => {
    evalScript(`jsbox.setMark()`);
  }
};

module.exports = {
  systemKeymap
};
