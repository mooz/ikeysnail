(function() {
  let ID = Date.now();
  function log(message) {
    message += " (" + ID + " " + location.href + ")";
    $notify("log", { message });
  }

  if (window !== window.parent) {
    // Do not load in ifrmae pages
    return;
  }

  let jsboxEditorElement = null;
  let aceEditor = null;
  let codeMirror = null;

  let marked = false;

  try {
    function getEditorElement() {
      return document.activeElement || document.documentElement;
    }

    function setupBackspaceHandler(editorElement, dispatcher) {
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
              log("In composition. Ignore.");
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

    function setupMarkResetHandler(editorElement) {
      editorElement.addEventListener(
        "keydown",
        keyEvent => {
          if (keyEvent.__keepMark__) {
          } else {
            marked = false;
          }
        },
        false
      );
    }

    function intializeCodeMirror() {
      codeMirror = document.querySelector(".CodeMirror").CodeMirror;
      jsboxEditorElement = codeMirror.display.input.getField();
      setupMarkResetHandler(jsboxEditorElement);
      setupBackspaceHandler(jsboxEditorElement, () => jsbox.dispatchKeydown(8));
      jsboxEditorElement.style.cursor = "none";
    }

    function initializeAce() {
      // nothing
    }

    function initializeOverleaf() {
      aceEditor = window._debug_editors[window._debug_editors.length - 1];
      setupMarkResetHandler(document.querySelector(".ace_text-input"));

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
      jsboxEditorElement = document.getElementById("text-input");

      setupBackspaceHandler(jsboxEditorElement, () =>
        jsbox.dispatchKeydown(72, false, true)
      );
      setupMarkResetHandler(jsboxEditorElement);

      jsboxEditorElement.addEventListener(
        "DOMFocusIn",
        () => {
          setTimeout(() => {
            const offsetY = Math.floor(window.innerHeight / 3);
            const cursorY = $(jsboxEditorElement).offset().top;
            $("html,body").animate(
              { scrollTop: cursorY - offsetY },
              { duration: "fast", queue: false }
            );
          }, 20);
        },
        false
      );

      // Cursor tweak
      let cursor = document.getElementsByClassName("cursor")[0];
      const textAreaStyle = jsboxEditorElement.style;
      const cursorStyle = cursor.style;
      const cursorObserver = new MutationObserver(records => {
        for (const record of records) {
          if (textAreaStyle.width === "100%") {
            textAreaStyle.top = "-10000px";
            return;
          }
          textAreaStyle.top = cursorStyle.top;
          const leftNum = parseInt(cursorStyle.left) - 4;
          textAreaStyle.left = leftNum + "px";
          textAreaStyle.height = cursorStyle.height;
        }
      });
      cursorObserver.observe(cursor, {
        attributes: true,
        attributeFilter: ["style"]
      });

      // Last URL saver
      let lastUrl = "";
      const titleObserver = new MutationObserver(records => {
        for (const record of records) {
          if (lastUrl !== location.href) {
            lastUrl = location.href;
            $notify("urlDidChange", { url: location.href });
            setTimeout(() => {
              if (parseInt(jsboxEditorElement.style.left) > 0) return;
              jsboxEditorElement.blur();
            }, 300);
          }
        }
      });
      const title = document.querySelector("head title");
      titleObserver.observe(title, { childList: true });

      // Double tap handler
      let isFirstTap = true;
      document.getElementById("editor").addEventListener(
        "click",
        () => {
          if (isFirstTap) {
            isFirstTap = false;
            setTimeout(() => {
              isFirstTap = true;
            }, 450);
          } else {
            isFirstTap = true;
            $notify("doubleTapped");
          }
        },
        false
      );
    }

    function initialize(trialTimes) {
      if (document.querySelector(".CodeMirror")) {
        log("Code mirror Initialized.");
        intializeCodeMirror();
        return;
      } else if (document.getElementById("text-input")) {
        // Scrapbox
        log("Scrapbox Initialized.");
        initializeScrapbox();
        return;
      } else if (
        window._debug_editors &&
        document.querySelector(".file-tree ul.file-tree-list") &&
        document.querySelector(".ace_text-input")
      ) {
        // Overleaf v2 provides access to ACE editor instance as `window._debug_editors`.
        // See https://www.overleaf.com/learn/how-to/How_can_I_define_custom_Vim_macros_in_a_vimrc_file_on_Overleaf%3F
        initializeOverleaf();
        log("Overleaf initialized");
        return;
      }

      // if (!jsboxEditorElement) {
      log("Not found. Retrying ...");
      trialTimes++;
      if (trialTimes > 5) {
        return;
      }
      setTimeout(() => {
        initialize(trialTimes);
      }, 1000);
      // }
    }

    initialize(0);

    window.jsbox = {
      setMark: function() {
        marked = true;
      },
      dispatchKeydown: function(
        keyCode,
        withShift = false,
        withCtrl = false,
        withAlt = false,
        withCommand = false,
        keepMark = false
      ) {
        {
          let ev = document.createEvent("Event");
          ev.initEvent("keydown", true, true);
          ev.__keepMark__ = keepMark;
          ev.keyCode = keyCode;
          ev.which = keyCode;
          ev.shiftKey = withShift;
          if (keepMark && marked) {
            ev.shiftKey = true;
          }
          ev.ctrlKey = withCtrl;
          ev.altKey = withAlt;
          ev.metaKey = withCommand;
          getEditorElement().dispatchEvent(ev);
        }
      },
      dispatchKeypress: function(
        charCode,
        withShift = false,
        withCtrl = false,
        withAlt = false,
        withCommand = false,
        key = null,
        keepMark = false
      ) {
        let ev = document.createEvent("Event");
        ev.initEvent("keypress", true, true);
        ev.charCode = ev.keyCode = ev.which = 92;
        if (key) {
          ev.key = key;
        }
        ev.shiftKey = withShift;
        ev.ctrlKey = withCtrl;
        ev.altKey = withAlt;
        ev.metaKey = withCommand;
        getEditorElement().dispatchEvent(ev);
      },
      doubleClick: function() {
        const dclEvent = new MouseEvent("dblclick", {
          bubbles: true,
          cancelable: true,
          view: window
        });
        getEditorElement().dispatchEvent(dclEvent);
      },
      getSelectedText: function() {
        if (aceEditor) {
          return aceEditor.getSelectedText();
        } else if (codeMirror) {
          return codeMirror.getSelection();
        } else {
          let selection = window.getSelection().toString();
          log(selection);
          log("@@@@");
          return window.getSelection().toString();
        }
      },
      insertText: function(text, escaped = false) {
        if (escaped) {
          text = unescape(text);
        }
        if (aceEditor) {
          aceEditor.insert(text);
        } else if (codeMirror) {
          codeMirror.replaceSelection(text);
        } else {
          document.execCommand("insertText", false, text);
        }
      },
      recenter: function() {
        if (aceEditor) {
          aceEditor.centerSelection();
        } else if (codeMirror) {
          var pos = codeMirror.cursorCoords(null, "local");
          codeMirror.scrollTo(
            null,
            (pos.top + pos.bottom) / 2 -
              codeMirror.getScrollInfo().clientHeight / 2
          );
        } else if (document.querySelector(".cursor")) {
          var $target = $(".cursor");
          var offset = $target.offset() || { top: 0, left: 0 };
          var outerHeight = $target.outerHeight();
          $(window).scrollTop(
            offset.top - (window.innerHeight - outerHeight) / 2
          );
        }
      }
    };
  } catch (x) {
    log("Error executing the user script");
    log(x + "");
  }
})();
