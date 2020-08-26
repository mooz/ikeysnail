class Observer {
  constructor() {}

  _onReady() {}

  _onExit() {}

  onReady() {
    try {
      this._onReady();
    } catch (x) {
      console.error(x);
    }
  }

  onExit() {
    try {
      this._onExit();
    } catch (x) {
      console.error(x);
    }
  }
}

export class SystemKeyHandler extends Observer {
  constructor(browser, config) {
    super();
    this.browser = browser;
    this.config = config;
  }

  _onExit() {
    $objc("RedBoxCore").$cleanClass("UIApplication");
  }

  _onReady() {
    function flip(obj) {
      const ret = {};
      Object.keys(obj).forEach(key => {
        ret[obj[key]] = key;
      });
      return ret;
    }

    let ctrlKey = false;
    let metaKey = false;
    let optionKey = false;

    let locationBarInputElement = this.browser._locationBar.element.runtimeValue();
    let findBarInputElement = this.browser._searchBar.textInput.runtimeValue();

    const key = {
      option: 226,
      meta: 227,
      Escape: 41,
      Enter: 40,
      ctrl: 224,
      " ": 44
    };
    for (let i = 0; i < 27; ++i) {
      key[String.fromCharCode(97 + i)] = 4 + i;
    }
    let config = this.config;
    if (config.SWAP_COMMAND_OPTION) {
      let originalOption = key.option;
      key.option = key.meta;
      key.meta = originalOption;
    }
    Object.freeze(key);
    const codeToKey = flip(key);

    let defaultCommands = Object.assign({}, config.systemKeyMap.all);
    if (config.CAPTURE_CTRL_SPACE) {
      defaultCommands["ctrl- "] = browser =>
        browser.selectedTab.dispatchCtrlSpace();
    }
    let findBarCommands = Object.assign({}, config.systemKeyMap.findBar);
    let urlBarCommands = Object.assign({}, config.systemKeyMap.urlBar);

    // Key repeat handler
    let keyRepeatTimer = null;
    let keyRepeatThread = null;
    let keyRepeatString = null;

    let browser = this.browser;

    // Global key configuration
    $define({
      type: "UIApplication",
      events: {
        // Swizzling handleKeyUIEvent doesn't work. We need to swizzle the private one (_handleXXX).
        "_handleKeyUIEvent:": evt => {
          // https://developer.limneos.net/?ios=11.1.2&framework=UIKit.framework&header=UIPhysicalKeyboardEvent.h
          // console.log(evt);
          // console.log("commandModifiedInput: " + evt.$__commandModifiedInput());
          // console.log("gsModifierFlags: " + evt.$__gsModifierFlags());
          // console.log("inputFlags: " + evt.$__inputFlags());
          // console.log("isKeyDown: " + evt.$__isKeyDown());
          // console.log("keyCode: " + evt.$__keyCode());
          // console.log("markedInput: " + evt.$__markedInput());
          // console.log("modifiedInput: " + evt.$__modifiedInput());
          // console.log("modifierFlags: " + evt.$__modifierFlags());
          // console.log("privateInput: " + evt.$__privateInput());
          // console.log("shiftModifiedInput: " + evt.$__shiftModifiedInput());
          // console.log("unmodifiedInput: " + evt.$__unmodifiedInput());

          const keyCode = evt.$__keyCode();
          const pressed = evt.$__isKeyDown();
          const keyString = codeToKey[keyCode];

          if (!codeToKey.hasOwnProperty(keyCode)) {
            return self.$ORIG__handleKeyUIEvent(evt);
          }

          // Up -> 82
          // Down -> 81
          // Left -> 80
          // Right -> 79

          // Exec commands
          if (keyCode === key.ctrl) {
            ctrlKey = pressed;
          } else if (keyCode === key.meta) {
            metaKey = pressed;
          } else if (keyCode === key.option) {
            optionKey = pressed;
          } else {
            let completeKeyString = keyString;
            if (metaKey) completeKeyString = "meta-" + completeKeyString;
            if (ctrlKey) completeKeyString = "ctrl-" + completeKeyString;
            if (optionKey) completeKeyString = "alt-" + completeKeyString;

            function handleKeyDown(completeKeyString, commands) {
              if (keyRepeatString !== completeKeyString) {
                if (keyRepeatTimer) {
                  clearTimeout(keyRepeatTimer);
                  if (keyRepeatThread) {
                    clearInterval(keyRepeatThread);
                    keyRepeatThread = null;
                  }
                }
                keyRepeatString = completeKeyString;
                keyRepeatTimer = setTimeout(() => {
                  keyRepeatThread = setInterval(() => {
                    commands[completeKeyString](browser);
                  }, config.KEY_REPEAT_INTERVAL);
                }, config.KEY_REPEAT_INITIAL);
              }

              commands[completeKeyString](browser);
            }

            function handleKeyUp(completeKeyString) {
              if (completeKeyString === keyRepeatString) {
                if (keyRepeatTimer) clearTimeout(keyRepeatTimer);
                if (keyRepeatThread) clearInterval(keyRepeatThread);
                keyRepeatString = null;
                keyRepeatTimer = null;
                keyRepeatThread = null;
              }
            }

            // Decide keymap
            let commands = defaultCommands;
            if (locationBarInputElement.$isFirstResponder()) {
              commands = urlBarCommands;
            } else if (findBarInputElement.$isFirstResponder()) {
              commands = findBarCommands;
            }

            if (commands.hasOwnProperty(completeKeyString)) {
              if (pressed) {
                handleKeyDown(completeKeyString, commands);
              } else {
                handleKeyUp(completeKeyString);
              }
              return null;
            } else {
              // If key is pressed
              if (!pressed) {
                handleKeyUp(completeKeyString);
              }
            }
          }
          return self.$ORIG__handleKeyUIEvent(evt);
        }
      }
    });
  }
}

export class ShortcutKeyDeactivator extends Observer {
  constructor() {
    super();
  }

  _onExit() {
    $objc("RedBoxCore").$cleanClass("UIResponder");
  }

  _onReady() {
    $define({
      type: "UIResponder",
      events: {
        "_keyCommandForEvent:": evt => {
          // Disable all shortcut keys of JSBox (Meta-w)
          // TODO: Does overriding `keyCommands` property work? (it's bettter, because it prevents showing shortcut key help)
          return null;
        }
      }
    });
  }
}
