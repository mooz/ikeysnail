const { dispatchKeys, evalScript } = require("./system-remap");

// Cocoa-level keymap
const systemKeymap = {
  "ctrl- ": () => {
    evalScript(`jsbox.setMark()`);
  }
};

module.exports = {
  systemKeymap
};
