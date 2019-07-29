(() => {
  let beginTime = Date.now();

  function log(message) {
    if (config.DEBUG_CONSOLE) {
      $notify("log", { message });
    }
  }

  function message(msg, duration) {
    if (config.DEBUG_SHOW_MESSAGE) {
      $notify("message", { message: msg, duration: duration });
    }
  }

  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // Do not load in ifrmae pages
  if (window !== window.parent || inIframe()) {
    return;
  }

  $notify("titleDetermined", { title: document.title });

  const config = { sites: [] };
  const Z_INDEX_MAX = 2147483000;
  let gLocalKeyMap = null;
  let gRichTextEditorInputElement = null;
  let gAceEditor = null;
  let gCodeMirror = null;
  let gGoogleDocsEditor = null;
  let gStatusMarked = false;
  let gHitHintDisposerInternal = null;

  function insertStyle(style) {
    let styleElement = document.createElement("style");
    document.head.appendChild(styleElement);
    styleElement.textContent = style;
  }

  function clickElement(selectedElm) {
    let ev = document.createEvent("HTMLEvents");
    ev.initEvent("click", true, false);
    selectedElm.dispatchEvent(ev);
  }

  function hitHint(customSelector, customDisposer) {
    // Thanks to https://qiita.com/okayu_tar_gz/items/924481d4acf50be37618
    const settings = {
      elm: {
        allow: [
          "a",
          "button:not([disabled])",
          "details",
          'input:not([type="disabled" i]):not([type="_hidden" i]):not([type="readonly" i])',
          "select:not([disabled])",
          "textarea:not([disabled]):not([readonly])",
          '[contenteditable=""]',
          '[contenteditable="true" i]',
          "[onclick]",
          "[onmousedown]",
          "[onmouseup]",
          '[role="button" i]',
          '[role="checkbox" i]',
          '[role="link" i]',
          '[role="menuitemcheckbox" i]',
          '[role="menuitemradio" i]',
          '[role="option" i]',
          '[role="radio" i]',
          '[role="switch" i]'
        ],
        block: []
      },
      hintCh: "asdfghjkl"
    };

    const clickableElms = [
      ...document.querySelectorAll(
        customSelector
          ? customSelector
          : settings.elm.allow.join(",") || undefined
      )
    ]
      .filter(
        elm => elm.closest(settings.elm.block.join(",") || undefined) === null
      )
      .map(elm => {
        const domRect = elm.getBoundingClientRect();

        return {
          bottom: Math.floor(domRect.bottom),
          elm: elm,
          height: Math.floor(domRect.height),
          left: Math.floor(domRect.left || domRect.x),
          right: Math.floor(domRect.right),
          top: Math.floor(domRect.top || domRect.y),
          width: Math.floor(domRect.width)
        };
      })
      .filter(data => {
        const windowH = window.innerHeight,
          windowW = window.innerWidth;

        return (
          data.width > 0 &&
          data.height > 0 &&
          data.bottom > 0 &&
          data.top < windowH &&
          data.right > 0 &&
          data.left < windowW
        );
      });

    function createTextHints(amount) {
      const hintKeys = settings.hintCh.toUpperCase();
      const hintKeysLength = hintKeys.length;
      var reverseHints = {};
      var numHints = 0;
      var uniqueOnly = true;

      function next(hint) {
        var l = hint.length;
        if (l === 0) {
          return hintKeys.charAt(0);
        }
        var p = hint.substr(0, l - 1);
        var n = hintKeys.indexOf(hint.charAt(l - 1)) + 1;
        if (n === hintKeysLength) {
          var np = next(p);
          if (uniqueOnly) {
            delete reverseHints[np];
            numHints--;
          }
          return np + hintKeys.charAt(0);
        } else {
          return p + hintKeys.charAt(n);
        }
      }

      var hint = "";
      while (numHints < amount) {
        hint = next(hint);
        reverseHints[hint] = true;
        numHints++;
      }
      var hints = [];
      for (let hint of Object.keys(reverseHints)) {
        hints.push(hint);
      }
      return hints;
    }

    const hints = createTextHints(clickableElms.length);

    const viewData = clickableElms
      .map((data, index) => {
        data.hintCh = hints[index];
        return data;
      })
      .map(data => {
        const hintElm = document.createElement("div");
        hintElm.classList.add("keysnail-hint");
        hintElm.style.top = `${data.top}px`;
        hintElm.style.left = `${data.left}px`;
        hintElm.textContent = data.hintCh;
        document.body.appendChild(hintElm);
        data.hintElm = hintElm;
        return data;
      });

    const fin = () => {
      gHitHintDisposerInternal = null;
      window.removeEventListener("keydown", onkeydown);
      viewData.forEach(data => {
        if (data.hintElm) {
          data.hintElm.remove();
        }
      });
      if (customDisposer) {
        customDisposer();
      }
    };

    let input = "";
    const onkeydown = e => {
      if (!(e.metaKey || e.shiftKey)) {
        if (e.key === "Control" || e.key === "Alt") {
          return;
        }
        e.preventDefault();

        if (e.key === "Escape" || (e.key === "g" && e.ctrlKey)) {
          fin();
        } else {
          input += e.key.toUpperCase();

          viewData
            .filter(data => !data.hintCh.startsWith(input))
            .forEach(data => {
              data.hintElm.remove();
            });

          const selectedElms = viewData.filter(data =>
            data.hintCh.startsWith(input)
          );

          if (selectedElms.length === 0) {
            fin();
            return;
          }

          if (selectedElms.length === 1 && selectedElms[0].hintCh === input) {
            let selectedElm = selectedElms[0].elm;
            selectedElm.focus();
            clickElement(selectedElm);
            fin();
          }
        }
      }
    };

    gHitHintDisposerInternal = fin;
    window.addEventListener("keydown", onkeydown);
  }

  const nonDisplayableKeys = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Escape: 27,
    " ": 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    Delete: 46
  };
  const keyToKeyCode = Object.assign(
    {
      ";": 59,
      "=": 61,
      "^": 160,
      "!": 161,
      "#": 163,
      $: 164,
      ",": 188,
      ".": 190,
      "/": 191,
      "`": 192,
      "[": 219,
      "\\": 220,
      "]": 221,
      "'": 222
    },
    nonDisplayableKeys
  );
  // 0 ~ 9
  for (let i = 0; i < 10; ++i) {
    keyToKeyCode[i] = 48 + i;
  }
  // a ~ z
  for (let i = 0; i < 26; ++i) {
    keyToKeyCode[String.fromCharCode(97 + i)] = 65 + i;
  }
  // F1 ~ F24
  for (let i = 1; i <= 24; ++i) {
    keyToKeyCode["F" + i] = 111 + i;
  }

  function keyToString(ev) {
    const modifiers = ["ctrl", "alt", "meta"];
    if (nonDisplayableKeys.hasOwnProperty(ev.key)) {
      modifiers.push("shift");
    }
    const modifierStrings = modifiers.reduce(
      (modifierStrings, modifier) =>
        ev[`${modifier}Key`]
          ? modifierStrings.concat([modifier])
          : modifierStrings,
      []
    );
    return modifierStrings.concat([ev.key]).join("-");
  }

  function parseKeyString(compositeKeyString) {
    const modifierMapJS = new Map([
      ["ALT", "withAlt"],
      ["SHIFT", "withShift"],
      ["COMMAND", "withMeta"],
      ["META", "withMeta"],
      ["CTRL", "withCtrl"]
    ]);

    return compositeKeyString.split("-").reduce(
      (keyEventArgument, keyString) => {
        if (modifierMapJS.has(keyString.toUpperCase())) {
          keyEventArgument[modifierMapJS.get(keyString.toUpperCase())] = true;
        } else {
          keyEventArgument.key = keyString;
        }
        return keyEventArgument;
      },
      {
        key: null,
        withCtrl: false,
        withShift: false,
        withAlt: false,
        withMeta: false
      }
    );
  }

  function inEditorLikeMode() {
    let elem = document.activeElement;
    let tag = elem.tagName;
    // TODO: Check if "contentEditable" attribute is on
    return (
      tag === "TEXTAREA" ||
      tag === "INPUT" ||
      elem === gRichTextEditorInputElement
    );
  }

  const shortcutKeyHandler = keyEvent => {
    if (gHitHintDisposerInternal) {
      // Hit-Hint mode. Ignore.
      return;
    }

    if (keyEvent.__keysnail__) {
      // Synthetic. Ignore.
      return;
    }

    if (
      keyEvent.key === "Control" ||
      keyEvent.key === "Alt" ||
      keyEvent.key === "Meta" ||
      keyEvent.key === "Shift"
    ) {
      return;
    }

    let mode = null;
    if (!inEditorLikeMode()) {
      mode = "view";
    } else if (document.activeElement === gRichTextEditorInputElement) {
      mode = "rich";
    } else {
      mode = "edit";
    }

    const keyString = keyToString(keyEvent);

    if (config.DEBUG_SHOW_INPUT_KEY) {
      message("Input: " + keyString);
    }

    let keepMark = false;
    let keyMap = gLocalKeyMap[mode];

    if (
      keyMap.hasOwnProperty(keyString) ||
      gLocalKeyMap.all.hasOwnProperty(keyString)
    ) {
      let command = keyMap[keyString] || gLocalKeyMap.all[keyString];
      if (!command) {
        // "null" refers to disabled keymap
        return;
      }

      keyEvent.stopPropagation();
      keyEvent.preventDefault();

      // `key: XXX` is abbreviation of `key: { command: XXX, marked: false }`
      if (command.command) {
        keepMark = !!command.marked;
        command = command.command;
      }
      if (typeof command === "function") {
        // Exec function
        command();
      } else {
        keysnail.dispatchKey(command, keepMark);
      }
    }
    if (!keepMark) {
      // Reset mark
      gStatusMarked = false;
    }
  };

  function setupInCompositionHandler(editorElement, dispatcher) {
    // Ctr+h should be handled separately.
    let inComposition = false;
    editorElement.addEventListener(
      "compositionstart",
      () => {
        inComposition = true;
      },
      false
    );
    editorElement.addEventListener(
      "compositionend",
      () => {
        inComposition = false;
      },
      false
    );
    editorElement.addEventListener(
      "keydown",
      keyEvent => {
        if (keyEvent.keyCode === 72 && keyEvent.key === "Backspace") {
          if (inComposition) {
          } else {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
            dispatcher();
          }
        }
      },
      false
    );
  }

  function initializeRichTextEditor(trialTimes) {
    function initializeCodeMirror() {
      gCodeMirror = document.querySelector(".CodeMirror").CodeMirror;
      gRichTextEditorInputElement = gCodeMirror.display.input.getField();
      setupInCompositionHandler(gRichTextEditorInputElement, () =>
        keysnail.dispatchKey("Backspace")
      );
      gRichTextEditorInputElement.style.cursor = "none";
    }

    function initializeOverleaf() {
      gAceEditor = window._debug_editors[window._debug_editors.length - 1];
      gRichTextEditorInputElement = document.querySelector(".ace_text-input");
      setupInCompositionHandler(gRichTextEditorInputElement, () => {
        keysnail.dispatchKey("ctrl-Backspace");
      });

      let scrollAmount = 300;
      let fileTreeToolbar = $(".file-tree .toolbar-right");
      let fileList = $(".file-tree ul.file-tree-list");

      fileTreeToolbar.append(
        $(`<a href=""><i class="fa fa-fw fa-arrow-up" /></a>`).on("click", () =>
          fileList.scrollTop(fileList.scrollTop() - scrollAmount)
        )
      );
      fileTreeToolbar.append(
        $(`<a href=""><i class="fa fa-fw fa-arrow-down" /></a>`).on(
          "click",
          () => fileList.scrollTop(fileList.scrollTop() + scrollAmount)
        )
      );
    }

    function initializeScrapbox() {
      gRichTextEditorInputElement = document.getElementById("text-input");
      setupInCompositionHandler(gRichTextEditorInputElement, ev =>
        keysnail.dispatchKey("Backspace")
      );
      // Last URL saver
      let lastUrl = "";
      const titleObserver = new MutationObserver(records => {
        for (const record of records) {
          if (lastUrl !== location.href) {
            lastUrl = location.href;
            $notify("urlDidChange", { url: location.href });
          }
        }
      });
      const title = document.querySelector("head title");
      titleObserver.observe(title, { childList: true });
    }

    if (document.querySelector(".CodeMirror")) {
      log("Code mirror Initialized.");
      initializeCodeMirror();
    } else if (
      location.host === "scrapbox.io" &&
      document.getElementById("text-input")
    ) {
      // Scrapbox
      log("Scrapbox Initialized.");
      initializeScrapbox();
    } else if (
      window._debug_editors &&
      document.querySelector(".file-tree ul.file-tree-list") &&
      document.querySelector(".ace_text-input")
    ) {
      // Overleaf v2 provides access to ACE editor instance as `window._debug_editors`.
      // See https://www.overleaf.com/learn/how-to/How_can_I_define_custom_Vim_macros_in_a_vimrc_file_on_Overleaf%3F
      initializeOverleaf();
      log("Overleaf initialized");
    } else if (document.querySelector(".editor__inner")) {
      gRichTextEditorInputElement = document.querySelector(".editor__inner");
    } else if (document.querySelector(".docs-texteventtarget-iframe")) {
      gRichTextEditorInputElement = document.querySelector(
        ".docs-texteventtarget-iframe"
      );
      gGoogleDocsEditor = gRichTextEditorInputElement.contentWindow.document.querySelector(
        '[contenteditable="true"]'
      );
      gGoogleDocsEditor.addEventListener(
        "keydown",
        ev => shortcutKeyHandler(ev),
        true
      );
    } else {
      trialTimes++;
      if (trialTimes < 10) {
        setTimeout(() => {
          initializeRichTextEditor(trialTimes);
        }, 500);
      }
    }
  }

  function getKeyEventReceiver() {
    return (
      gGoogleDocsEditor || document.activeElement || document.documentElement
    );
  }

  class Panel {
    constructor() {
      let popup = document.createElement("div");
      popup.setAttribute("id", "keysnail-popup");
      popup.addEventListener(
        "mousedown",
        ev => {
          // Events occur in the following order: "mousedown" -> "blur" -> "click"
          // Without the following hack, clicking links in the panel doesn't work
          // because precedent "blur" dispatched `disposer`.
          if (ev.target.tagName === "A") {
            this.action(this._filteredCandidates.indexOf(ev.target));
            ev.preventDefault();
            ev.stopPropagation();
          }
        },
        true
      );

      let queryInput = document.createElement("input");
      queryInput.setAttribute("id", "keysnail-popup-query");
      queryInput.addEventListener(
        "input",
        ev => {
          this._filterCandidatesByQuery(queryInput.value);
        },
        false
      );
      queryInput.addEventListener(
        "keydown",
        ev => {
          this._handleKeyEvent(ev);
        },
        false
      );
      popup.appendChild(queryInput);

      let candidateList = document.createElement("div");
      candidateList.setAttribute("id", "keysnail-popup-candidates");
      popup.appendChild(candidateList);

      this.popup = popup;
      this.queryInput = queryInput;
      this.candidateList = candidateList;
      this._hidden = true;
      this._matchType = "and";
      this._query = "";
      this._index = 0;

      document.documentElement.appendChild(popup);
    }

    get _hidden() {
      return this.popup.classList.contains("hidden");
    }

    set _hidden(val) {
      if (val) {
        this.popup.classList.add("hidden");
      } else {
        this.popup.classList.remove("hidden");
      }
    }

    set hintMode(val) {
      if (val) {
        this.popup.classList.add("hint-mode");
      } else {
        this.popup.classList.remove("hint-mode");
      }
    }

    get hintMode() {
      return this.popup.classList.contains("hint-mode");
    }

    match(queries, candidate) {
      if (this._matchType === "and") {
        let text = candidate.textContent.toLowerCase();
        for (let query of queries) {
          if (text.indexOf(query) < 0) {
            return false;
          }
        }
        return true;
      }
    }

    _handleKeyEvent(ev) {
      let key = keyToString(ev);
      if (key === "ArrowUp") {
        this.selectPrevious();
      } else if (key === "ArrowDown") {
        this.selectNext();
      } else if (key === "Enter" || key === "ctrl-m") {
        this.action(this._index);
      }
    }

    action(index) {
      // TODO: make action customizable
      let candidate = this._filteredCandidates[index];
      candidate.focus();
      clickElement(candidate);
      message("Visiting: " + candidate.textContent);
      this.exit();
    }

    _filterCandidatesByQuery(query) {
      this._filteredCandidates = [];
      const patterns = query.split(/[ \t]/);
      // TODO: filtering? Lazily?
      for (let candidate of this.candidateList.childNodes) {
        if (this.match(patterns, candidate)) {
          candidate.classList.add("matched");
          this._filteredCandidates.push(candidate);
        } else {
          candidate.classList.remove("matched");
        }
      }
      this._selectCandidateByIndex(0);
    }

    get running() {
      return !this._hidden;
    }

    show() {
      this._hidden = false;
    }

    _setCandidates(candidates) {
      this._clearCandidates();
      candidates.forEach(candidate => {
        this._addCandidate(candidate.text, candidate.url);
      });
    }

    _clearCandidates() {
      while (this.candidateList.firstChild) {
        this.candidateList.firstChild.remove();
      }
      this._filteredCandidates = [];
    }

    _addCandidate(text, url) {
      let link = document.createElement("a");
      link.setAttribute("href", url);
      link.textContent = text;
      this.candidateList.appendChild(link);
    }

    _selectCandidateByIndex(indexToSelect) {
      this._filteredCandidates.forEach((candidate, index) => {
        if (index === indexToSelect) {
          candidate.classList.add("selected");
        } else {
          candidate.classList.remove("selected");
        }
      });
      this._index = indexToSelect;
    }

    selectNext() {
      this._selectCandidateByIndex(
        (this._index + 1) % this._filteredCandidates.length
      );
    }

    selectPrevious() {
      if (this._index - 1 < 0) {
        this._selectCandidateByIndex(this._filteredCandidates.length - 1);
      } else {
        this._selectCandidateByIndex(this._index - 1);
      }
    }

    exit() {
      this._hidden = true;
      if (gHitHintDisposerInternal) {
        gHitHintDisposerInternal();
      }
    }

    run(candidates, options) {
      options = options || {};
      this._setCandidates(candidates);
      this.hintMode = !!options.hints;
      this.show();
      if (this.hintMode) {
        hitHint(`#keysnail-popup a`, () => {
          this.exit();
        });
      } else {
        this.queryInput.value = options.query || "";
        this._filterCandidatesByQuery(this.queryInput.value);
        this.queryInput.focus();

        const disposer = () => {
          this.queryInput.removeEventListener("blur", disposer);
          this.exit();
        };
        this.queryInput.addEventListener("blur", disposer);
      }
    }
  }

  let gPanel = null;
  function getPanel() {
    if (!gPanel) {
      gPanel = new Panel();
    }
    return gPanel;
  }

  var keysnail = {
    setMark: function() {
      message("Set mark.");
      gStatusMarked = true;
    },
    launchDebugConsole: () => {
      // Firebug lite bookmarklet
      (function(F, i, r, e, b, u, g, L, I, T, E) {
        if (F.getElementById(b)) return;
        E = F[i + "NS"] && F.documentElement.namespaceURI;
        E = E ? F[i + "NS"](E, "script") : F[i]("script");
        E[r]("id", b);
        E[r]("src", I + g + T);
        E[r](b, u);
        (F[e]("head")[0] || F[e]("body")[0]).appendChild(E);
        E = new Image();
        E[r]("src", I + L);
      })(
        document,
        "createElement",
        "setAttribute",
        "getElementsByTagName",
        "FirebugLite",
        "4",
        "firebug-lite.js",
        "releases/lite/latest/skin/xp/sprite.png",
        "https://getfirebug.com/",
        "#startOpened"
      );
    },
    dispatchKey: (keyString, keepMark, fakeOriginal) => {
      let eventInfo = parseKeyString(keyString);
      keysnail.dispatchKeydown(
        eventInfo.key,
        eventInfo.withShift,
        eventInfo.withCtrl,
        eventInfo.withAlt,
        eventInfo.withMeta,
        keepMark,
        fakeOriginal
      );
    },
    dispatchKeydown: function(
      key,
      withShift = false,
      withCtrl = false,
      withAlt = false,
      withCommand = false,
      keepMark = false,
      fakeOriginal = false
    ) {
      // https://developer.mozilla.org/ja/docs/Web/API/KeyboardEvent/key/Key_Values
      const eventArgs = {
        key: key,
        bubbles: true,
        cancelable: true,
        shiftKey: keepMark && gStatusMarked ? true : withShift,
        ctrlKey: withCtrl,
        altKey: withAlt,
        metaKey: withCommand
      };
      if (keyToKeyCode.hasOwnProperty(key)) {
        eventArgs.keyCode = keyToKeyCode[key];
      }
      let ev = new KeyboardEvent("keydown", eventArgs);
      if (!fakeOriginal) {
        // mark so that our shortcut key handler receive the remapped code
        ev.__keysnail__ = true;
      }
      ev.__keepMark__ = keepMark;

      if (config.DEBUG_SHOW_DISPATCH_KEY) {
        message("Dispatch: " + keyToString(ev));
      }

      getKeyEventReceiver().dispatchEvent(ev);
    },
    get hitHintDisposer() {
      return gHitHintDisposerInternal;
    },
    doubleClick: function() {
      const dclEvent = new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        view: window
      });
      getKeyEventReceiver().dispatchEvent(dclEvent);
    },
    getSelectedText: function() {
      if (gAceEditor) {
        return gAceEditor.getSelectedText();
      } else if (gCodeMirror) {
        return gCodeMirror.getSelection();
      } else {
        let selection = window.getSelection();
        return selection + "";
      }
    },
    insertText: function(text, escaped = false) {
      if (escaped) {
        text = unescape(text);
      }
      if (gAceEditor) {
        gAceEditor.insert(text);
      } else if (gCodeMirror) {
        gCodeMirror.replaceSelection(text);
      } else if (document.activeElement.contentWindow) {
        let doc = document;
        doc = document.activeElement.contentWindow.document;
        doc.execCommand("insertText", false, text);
      } else {
        document.execCommand("insertText", false, text);
      }
    },
    escape: function() {
      if (gStatusMarked) {
        gStatusMarked = false;
      } else {
        document.activeElement.blur();
        document.documentElement.focus();
      }
    },
    recenter: function() {
      if (gAceEditor) {
        gAceEditor.centerSelection();
      } else if (gCodeMirror) {
        var pos = gCodeMirror.cursorCoords(null, "local");
        gCodeMirror.scrollTo(
          null,
          (pos.top + pos.bottom) / 2 -
            gCodeMirror.getScrollInfo().clientHeight / 2
        );
      } else if (document.querySelector(".cursor")) {
        var $target = $(".cursor");
        var offset = $target.offset() || { top: 0, left: 0 };
        var outerHeight = $target.outerHeight();
        $(window).scrollTop(
          offset.top - (window.innerHeight - outerHeight) / 2
        );
      }
    },
    scrollDown: function() {
      window.scrollBy(0, 150);
    },
    scrollUp: function() {
      window.scrollBy(0, -150);
    },
    scrollPageDown: function() {
      window.scrollBy(0, 500);
    },
    scrollPageUp: function() {
      window.scrollBy(0, -500);
    },
    back: function() {
      history.back();
    },
    forward: function() {
      history.forward();
    },
    cursorBottom: function() {
      window.scrollTo(0, document.body.scrollHeight);
    },
    cursorTop: function() {
      window.scrollTo(0, 0);
    },
    focusEditor: function() {
      // insert mode
      if (gGoogleDocsEditor) {
        gGoogleDocsEditor.focus();
      } else if (gRichTextEditorInputElement) {
        gRichTextEditorInputElement.focus();
      } else {
        keysnail.focusFirstInput();
      }
    },
    toggleHitHint: function() {
      if (keysnail.hitHintDisposer) {
        keysnail.hitHintDisposer();
      } else {
        keysnail.startHitHint();
      }
    },
    startHitHint: function() {
      return hitHint();
    },
    focusFirstInput: function() {
      let elements = Array.from(
        document.querySelectorAll(
          "input[type=text], input[type=search], input[type=password], textarea, textbox"
        )
      );
      elements.some(element => {
        // Check if the element is visible
        if (element.offsetParent !== null) {
          element.focus();
          return true;
        }
      });
    },
    paste: () => {
      $notify("paste");
    },
    killLine: () => {
      keysnail.dispatchKey("shift-End");
      let text = keysnail.getSelectedText();
      keysnail.dispatchKey("Backspace");
      $notify("copyText", { text });
    },
    killRegion: () => {
      const text = keysnail.getSelectedText();
      keysnail.dispatchKey("Backspace");
      $notify("copyText", { text });
    },
    copyRegion: () => {
      const text = keysnail.getSelectedText();
      $notify("copyText", { text });
      message("Copied!", 1);
    },
    startSiteSelector: () => {
      keysnail.runPanel(
        config.sites.map(site => ({
          text: `📖  ${site.alias} (${site.url})`,
          url: site.url
        })),
        { toggle: true }
      );
    },
    runPanel: (candidates, options) => {
      let panel = getPanel();
      panel.run(candidates, options);
    },
    marked: command => ({ command: command, marked: true })
  };

  /*@preserve SETTINGS_HERE*/

  setup(config, keysnail);

  initializeRichTextEditor(0);
  window.addEventListener(
    "keydown",
    ev => {
      try {
        shortcutKeyHandler(ev);
      } catch (x) {
        log("Error in shortcutKeyHandler: " + x);
      }
    },
    true
  );

  gLocalKeyMap = {
    all: Object.assign({}, config.globalKeyMap.all),
    view: Object.assign({}, config.globalKeyMap.view),
    rich: Object.assign({}, config.globalKeyMap.rich),
    edit: Object.assign({}, config.globalKeyMap.edit)
  };

  insertStyle(`
#keysnail-popup * {
   box-sizing: border-box;
   font-family: "menlo" !important;
   font-size: 15px !important;      
}
#keysnail-popup {
     display: block !important;
     box-shadow: 0px 2px 5px rgba(0,0,0,0.8) !important;
     position: fixed !important;
     top: 10% !important;
     left: 10% !important;
     padding: 1em !important;
     min-width: 80% !important;
     height: 80% !important;
     background: white !important;
     opacity: 0.95 !important;
     border: 1px solid black !important;
     border-radius: 1ex !important;
     z-index: ${Z_INDEX_MAX - 10} !important;
}
#keysnail-popup.hidden {
     display: none !important;
}
.hint-mode #keysnail-popup-query {
  display: none !important;
}
#keysnail-popup-candidates {
  overflow: hidden !important;
  height: 100%;
}
#keysnail-popup-query {
     width: 100%;
     margin: 0 0 1em 0;
     padding: 5px;
     color: black;
     border: 0px !important;
     border-radius: 3px;
     font-size: 16px;
     outline: none !important;
     background-color: #d8ecff;
 }
 #keysnail-popup-query:focus {
     background-color: #d8ecff;
 } 
 
 #keysnail-popup a {
     display: none;
     color: black !important;
     padding: 0.5em 2em !important;
     border-bottom: 1px solid black !important;
 }
 #keysnail-popup a.matched {
     display: block !important;
 }
 #keysnail-popup a.selected {
     background-color: pink;
 }
.keysnail-hint {
        background-color: yellow !important;
        color: black !important;
        font-family: "menlo" !important;
        font-size: 15px !important;
        padding: 2px !important;
        position: fixed !important;
        opacity: 0.8;
        z-index: ${Z_INDEX_MAX};        
}
`);

  for (let { url, keymap, style } of config.sites) {
    if (location.href.startsWith(url)) {
      if (keymap) {
        Object.assign(gLocalKeyMap.all, keymap.all || {});
        Object.assign(gLocalKeyMap.view, keymap.view || {});
        Object.assign(gLocalKeyMap.rich, keymap.rich || {});
        Object.assign(gLocalKeyMap.edit, keymap.edit || {});
      }
      insertStyle(style);
    }
  }

  window.__keysnail__ = keysnail;
})();
