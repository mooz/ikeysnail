function userScript() {
    let jsboxEditorElement;

    function log(message) {
        $notify('log', {message});
    }

    try {
        function getEditorElement() {
            log(jsboxEditorElement + "");
            return jsboxEditorElement || document.activeElement;
        }

        function initializeScrapbox() {
            jsboxEditorElement.addEventListener('DOMFocusIn', () => {
                setTimeout(() => {
                    const offsetY = Math.floor(window.innerHeight / 3);
                    const cursorY = $(jsboxEditorElement).offset().top;
                    $('html,body').animate(
                        {scrollTop: cursorY - offsetY},
                        {duration: 'fast', queue: false}
                    );
                }, 20);
            }, false);

            // Ctr+h should be handled separately.
            let inComposition = false;
            jsboxEditorElement.addEventListener('compositionstart', () => {
                inComposition = true;
            }, false);
            jsboxEditorElement.addEventListener('compositionend', () => {
                inComposition = false;
            }, false);
            jsboxEditorElement.addEventListener('keydown', (keyEvent) => {
                if (keyEvent.keyCode === 72 && keyEvent.key === "Backspace") {
                    if (inComposition) {
                        log("In composition. Ignore.");
                    } else {
                        keyEvent.stopPropagation();
                        keyEvent.preventDefault();
                        jsbox.dispatchKeydown(72, false, true);
                    }
                }
            }, false);

            let cursor = document.getElementsByClassName('cursor')[0];
            const textAreaStyle = jsboxEditorElement.style;
            const cursorStyle = cursor.style;
            const cursorObserver = new MutationObserver(records => {
                for (const record of records) {
                    if (textAreaStyle.width === '100%') {
                        textAreaStyle.top = '-10000px';
                        return;
                    }
                    textAreaStyle.top = cursorStyle.top;
                    const leftNum = parseInt(cursorStyle.left) - 4;
                    textAreaStyle.left = leftNum + 'px';
                    textAreaStyle.height = cursorStyle.height;
                }
            });
            cursorObserver.observe(cursor, {attributes: true, attributeFilter: ['style']});

            let lastUrl = '';
            const titleObserver = new MutationObserver(records => {
                for (const record of records) {
                    if (lastUrl !== location.href) {
                        lastUrl = location.href;
                        $notify('urlDidChange', {'url': location.href});
                        setTimeout(() => {
                            if (parseInt(jsboxEditorElement.style.left) > 0) return;
                            jsboxEditorElement.blur();
                        }, 300);
                    }
                }
            });
            const title = document.querySelector('head title');
            titleObserver.observe(title, {childList: true});

            let isFirstTap = true;
            document.getElementById('editor').addEventListener('click', () => {
                if (isFirstTap) {
                    isFirstTap = false;
                    setTimeout(() => {
                        isFirstTap = true;
                    }, 450);
                } else {
                    isFirstTap = true;
                    $notify('doubleTapped');
                }
            }, false);
        }

        function initialize(trialTimes) {
            if (document.querySelector('.CodeMirror')) {
                log('Code mirror Initialized.');
                jsboxEditorElement = document.querySelector('.CodeMirror');
            } else if (document.getElementById('text-input')) {
                // Scrapbox
                log('Scrapbox Initialized.');
                jsboxEditorElement = document.getElementById('text-input');
                initializeScrapbox();
            }

            if (!jsboxEditorElement) {
                log('Not found. Retrying ...');
                trialTimes++;
                if (trialTimes > 5) {
                    return;
                }
                setTimeout(() => {
                    initialize(trialTimes);
                }, 1000);
            }
        }

        initialize(0);

        window.jsbox = {
            keydownEvent: document.createEvent('Event'),
            keypressEvent: document.createEvent('Event'),
            'dispatchKeydown': function (keyCode, withShift = false, withCtrl = false, withAlt = false, withCommand = false) {
                this.keydownEvent.keyCode = keyCode;
                this.keydownEvent.which = keyCode;
                this.keydownEvent.shiftKey = withShift;
                this.keydownEvent.ctrlKey = withCtrl;
                this.keydownEvent.altKey = withAlt;
                this.keydownEvent.metaKey = withCommand;
                getEditorElement().dispatchEvent(this.keydownEvent);
            },
            'dispatchKeypress': function (charCode, withShift = false, withCtrl = false, withAlt = false, withCommand = false, key = null) {
                this.keypressEvent.charCode = this.keypressEvent.keyCode = this.keypressEvent.which = 92;
                if (key) {
                    this.keypressEvent.key = key;
                }
                this.keypressEvent.shiftKey = withShift;
                this.keypressEvent.ctrlKey = withCtrl;
                this.keypressEvent.altKey = withAlt;
                this.keypressEvent.metaKey = withCommand;
                getEditorElement().dispatchEvent(this.keypressEvent);
            },
            'doubleClick': function () {
                const dclEvent = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                getEditorElement().dispatchEvent(dclEvent);
            },
            'getSelectedText': function () {
                if (window._debug_editors) {
                    // Overleaf v2 provides access to ACE editor instance as `window._debug_editors`.
                    // See https://www.overleaf.com/learn/how-to/How_can_I_define_custom_Vim_macros_in_a_vimrc_file_on_Overleaf%3F
                    return window._debug_editors[window._debug_editors.length-1].getCopyText();
                } else {
                    return window.getSelection().toString();
                }
            },
            'insertText': function (text, escaped=false) {
                if (escaped) {
                    text = unescape(text);
                }
                if (window._debug_editors) {
                    // Overleaf v2
                    window._debug_editors[window._debug_editors.length-1].insert(text);
                }
            },
            'recenter': function () {
                if (window._debug_editors) {
                    // Overleaf v2
                    window._debug_editors[window._debug_editors.length-1].centerSelection()
                }
            }
        };

        jsbox.keydownEvent.initEvent('keydown', true, true);
        jsbox.keypressEvent.initEvent('keypress', true, true);
    } catch (x) {
        log("Error executing the user script");
        log(x + "");
    }
}

module.exports.userScript = userScript;