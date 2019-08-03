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

        console.log("Tab initializing");

        let tab = this;
        this.eventHandler = {
            log: ({message}) => {
                if (this.config.DEBUG_CONSOLE) {
                    log(message);
                }
            },
            titleDetermined: ({title}) => {
                this.title = title;
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
            createNewTab: () => {
                this.browser.createNewTab(null, true);
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

    get selected() {
        const browser = this.browser;
        return this === browser.selectedTab;
    }

    get loaded() {
        return this._loaded;
    }

    select() {
        this.load();
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
        if (this._loaded) {
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
        this.browser._updateTabView();
    }

    showBookmark() {
        evalScript(this, "__keysnail__.startSiteSelector(true)");
    }

    visitURL(url) {
        this.url = url;
    }

    load() {
        if (this._loaded) return;
        let source = this.createWidgetTabContent(this.url, this.userScript);
        this.browser._appendElementToView(source);
        this.runtimeWebView.$setAllowsBackForwardNavigationGestures(true);
        this._loaded = true;
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

    createWidgetTabContent(url, userScript) {
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
                if (this.config.TAB_VERTICAL) {
                    make.edges
                        .equalTo(view.super)
                        .insets($insets(this.config.TOPBAR_HEIGHT + 1, VERTICAL_TAB_WIDTH, 0, 0));
                } else {
                    make.edges
                        .equalTo(view.super)
                        .insets($insets(this.config.TOPBAR_HEIGHT + TAB_HEIGHT + 1, 0, 0, 0));
                }
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

exports.Tab = TabContentWebView;
