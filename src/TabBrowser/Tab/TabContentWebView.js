// const TOPBAR_HEIGHT = 35;
const VERTICAL_TAB_WIDTH = 300;
const TAB_HEIGHT = 30;

const {Component} = require("../../Component");

// -------------------------------------------------------------------- //
// Tab class
// -------------------------------------------------------------------- //

class TabContentWebView extends Component {
    constructor(browser,
                config,
                url = "http://www.google.com",
                userScript = "") {
        super();

        this.browser = browser;
        this.config = config;
        this.userScript = userScript;
        this._title = url;
        this.url = url;
        this._loaded = false;

        let tab = this;
        this.eventHandler = {
            log: ({message}) => {
                if (this.config.DEBUG_CONSOLE) {
                    log(message);
                }
            },
            titleDetermined: ({title}) => {
                if (this.element.url === "about:blank") {
                    this.title = "New Tab";
                } else {
                    this.title = title;
                }
                this.browser.onTabTitleDetermined(this);
            },
            didFinish: async sender => {
                // Nothing?
            },
            didStart: sender => {
                this.title = "Loading ...";
                this.browser.onTabStartLoading(this);
            },
            urlDidChange: async sender => {
                this.title = await evalScript(tab, "document.title", true);
                this.browser.onTabURLChanged(this);
            },
            exitApplication: () => $app.close(),
            share: () => this.browser.share(),
            scrap: () => this.browser.scrap(),
            message: ({message, duration}) => {
                $ui.toast(message, duration || 3);
            },
            paste: () => {
                evalScript(
                    tab,
                    `__keysnail__.insertText('${escape($clipboard.text)}', true)`,
                    false
                );
            },
            closeTab: () => {
                this.browser.closeTab(tab);
            },
            createNewTab: (args) => {
                let { url, openInBackground } = args || { url: null, openInBackground: false };
                this.browser.createNewTab(
                    url || "about:blank",
                    !openInBackground
                );
                if (!url) {
                    this.browser.focusLocationBar();
                }
            },
            selectNextTab: () => {
                this.browser.selectNextTab();
            },
            selectPreviousTab: () => {
                this.browser.selectPreviousTab();
            },
            focusLocationBar: () => {
                this.browser.focusLocationBar();
            },
            copyText: ({text}) => {
                $clipboard.set({type: "public.plain-text", value: text});
            },
            openClipboardURL: async () => {
                let url = await evalScript(tab, `__keysnail__.getSelectedText()`);
                if (!url) {
                    url = $clipboard.text;
                }
                this.browser.createNewTab(convertURLLikeInputToURL(url), true);
            },
            selectTabsByPanel: () => {
                browser.selectTabsByPanel();
            },
            selectTabByIndex: ({index}) => {
                this.browser.selectTab(index);
            }
        };
    }

    destroy() {
        this.visitURL(null); // Expect early GC
        this.removeMe();
    }

    get selected() {
        const browser = this.browser;
        return this === browser.selectedTab;
    }

    get loaded() {
        return this._loaded;
    }

    deselect() {
        if (this.element) {
            this.element.hidden = true;
        }
    }

    select() {
        this.load();
        if (this.element.hidden) {
            this.element.hidden = false;
        }
        // https://github.com/WebKit/webkit/blob/39a299616172a4d4fe1f7aaf573b41020a1d7358/Source/WebKit/UIProcess/API/Cocoa/WKWebView.mm#L1318
        this.runtimeWebView.$becomeFirstResponder();
    }

    set url(val) {
        this._url = val;
        if (this._loaded) {
            this.element.url = val;
        }
    }

    get url() {
        let url = null;
        if (this.element) {
            url = this.element.url;
        } else {
            url = this._url;
        }
        if (!url) {
            return this.config.NEW_PAGE_URL;
        }
        return url;
    }

    get element() {
        let element = $(this.id);
        return element;
    }

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
        this.browser._tabList.render();
    }

    showBookmark() {
        evalScript(this, "__keysnail__.startSiteSelector(true)");
    }

    goBack() {
        this.element.goBack();
    }

    goForward() {
        this.element.goForward();
    }

    visitURL(url) {
        this.url = url;
    }

    load() {
        if (this._loaded) return;
        this._loaded = true;
        this.render();
        this.runtimeWebView.$setAllowsBackForwardNavigationGestures(true);
    }

    get runtimeWebView() {
        return this.element.runtimeValue();
    }

    unload() {
        if (this._loaded) {
            this._loaded = false;
            this.element.url = null;
            this.element.remove();
        }
    }

    dispatchCtrlSpace() {
        evalScript(this, `__keysnail__.dispatchKey("ctrl- ", false, true)`);
    }


    build() {
        if (!this._loaded) return null;
      
        let url = this.url;
        let userScript = this.userScript;
        let props = {
            id: this.id,
            ua: this.config.USER_AGENT,
            script: userScript,
            hidden: false,
            url: url
        };

        return {
            type: "web",
            props: props,
            events: this.eventHandler,
            layout: (make, view) => {
                make.edges.equalTo(view.super);
            }
        };
    }

    evalScript(contentScript) {
        return new Promise((resolve, reject) => {
            this.element.eval({
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
    }
}

function evalScript(tab, contentScript, promisify = true) {
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
        tab.element.eval({script: contentScript});
        return null;
    }
}

exports.TabContentWebView = TabContentWebView;
