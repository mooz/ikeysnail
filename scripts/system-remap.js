const { keyCodeMap, charCodeMap } = require("./constants");

const modifierMapCocoa = new Map([
  ["ALT", 1 << 19],
  ["SHIFT", 1 << 17],
  ["COMMAND", 1 << 20],
  ["CTRL", 1 << 18]
]);
const modifierMapJS = new Map([
  ["ALT", "altKey"],
  ["SHIFT", "shiftKey"],
  ["COMMAND", "metaKey"],
  ["CTRL", "ctrlKey"]
]);

function toJSBoxKey(compositeKeyString) {
  let jsBoxKeyObject = compositeKeyString.split("-").reduce(
    (key, keyString) => {
      keyString = keyString.toUpperCase();
      if (modifierMapCocoa.has(keyString)) {
        key.modifiers |= modifierMapCocoa.get(keyString);
      } else {
        key.input = keyString;
      }
      return key;
    },
    { input: null, modifiers: 0 }
  );
  if (jsBoxKeyObject.modifiers === 0) {
    delete jsBoxKeyObject["modifiers"];
  }
  return jsBoxKeyObject;
}

function keyStringToCharCode(keyString) {
  if (charCodeMap.hasOwnProperty(keyString)) {
    return charCodeMap[keyString];
  } else {
    throw new Error("Unknown key (@keypress): [" + keyString + "]");
  }
}

function keyStringToKeyCode(keyString) {
  if (keyCodeMap.hasOwnProperty(keyString)) {
    return keyCodeMap[keyString];
  } else {
    throw new Error("Unknown key: [" + keyString + "]");
  }
}

function toJSKey(compositeKeyString) {
  return compositeKeyString.split("-").reduce(
    (key, keyString) => {
      keyString = keyString.toUpperCase();
      if (modifierMapJS.has(keyString)) {
        key[modifierMapJS.get(keyString)] = true;
      } else {
        // @ から始まる場合は keypress 扱いにする
        if (keyString.startsWith("@")) {
          key.key = keyStringToCharCode(keyString.slice(1));
          key.press = true;
        } else {
          key.key = keyStringToKeyCode(keyString);
        }
      }
      return key;
    },
    {
      key: null,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      press: false
    }
  );
}

function keyStringToDispatchScript(toKeys, keepMark = false) {
  return toKeys
    .map(compositeKeyString => {
      const key = toJSKey(compositeKeyString);
      if (key.press) {
        return `jsbox.dispatchKeypress(${key.key}, ${key.shiftKey}, ${key.ctrlKey}, ${key.altKey}, ${key.metaKey}, keepMark=${keepMark});`;
      } else {
        return `jsbox.dispatchKeydown(${key.key}, ${key.shiftKey}, ${key.ctrlKey}, ${key.altKey}, ${key.metaKey}, keepMark=${keepMark});`;
      }
    })
    .join("\n");
}

function dispatchKeys(tab, keys, promisify = false, keepMark = false) {
  if (typeof keys === "string") {
    keys = [keys];
  }
  const contentScript = keyStringToDispatchScript(keys, keepMark);
  return evalScript(tab, contentScript, promisify);
}

function evalScript(tab, contentScript, promisify = true) {
  // console.log(contentScript);
  if (promisify) {
    return new Promise((resolve, reject) => {
      tab.element.eval({
        script: contentScript,
        handler: (result, err) => {
          if (err || typeof result === "object") {
            reject(err);
          } else {
            resolve(result);
          }
        }
      });
    });
  } else {
    tab.element.eval({ script: contentScript });
    return null;
  }
}

function generateKeyCommands(keymap) {
  function remap(fromKey, toKeys) {
    let keyRemapObject = toJSBoxKey(fromKey);

    if (typeof toKeys === "function") {
      keyRemapObject.handler = toKeys;
    } else {
      keyRemapObject.handler = function() {
        // console.log(`OK, key handler called for ${fromKey}`);
        dispatchKeys(toKeys);
      };
    }

    return keyRemapObject;
  }

  return Object.keys(keymap).map(fromKey => remap(fromKey, keymap[fromKey]));
}

module.exports.dispatchKeys = dispatchKeys;
module.exports.evalScript = evalScript;
module.exports.toJSBoxKey = toJSBoxKey;
module.exports.generateKeyCommands = generateKeyCommands;
