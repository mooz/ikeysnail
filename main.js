const config = {sites: []};
require("./strings/settings").setup(config, {marked: () => null});

const VERTICAL = config.TAB_VERTICAL;
const VERTICAL_TAB_WIDTH = config.TAB_VERTICAL_WIDTH;
const TOPBAR_HEIGHT = 35;
const TAB_HEIGHT = 30;
const TAB_FONT_SIZE = 13;
const TAB_CLOSE_BUTTON_SIZE = 20;
const TAB_BG_SELECTED = "#efefef";
const TAB_FG_SELECTED = "#000000";
const TAB_BG_INACTIVE = "#cccccc";
const TAB_LIST_BG = "#bbbbbb";
const TAB_FG_INACTIVE = "#666666";
const URL_COLOR = "#2B9E46";

function log(message) {
    if (config.DEBUG_CONSOLE) {
        console.log(message);
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

function readMinified(prefix) {
    if ($file.exists(prefix + ".min.js")) {
        return $file.read(prefix + ".min.js").string;
    } else {
        return $file.read(prefix + ".js").string;
    }
}

function loadTabInfo() {
    return JSON.parse($file.read("last-tabs.json").string.trim());
}

function saveTabInfo(browser) {
    let tabURLs = browser.tabs.map(tab => tab.url);
    let lastTabIndex = browser.currentTabIndex;
    let lastTabInfo = [tabURLs, lastTabIndex];
    $file.write({
        data: $data({string: JSON.stringify(lastTabInfo)}),
        path: "last-tabs.json"
    });
}

function readUserScript() {
    let userSettings = readMinified("./strings/settings");
    let contentScript = readMinified("./strings/content-script");
    return contentScript.replace(
        "/*@preserve SETTINGS_HERE*/",
        "\n" + userSettings + "\n"
    );
}

function createWidgetTabContent(tab, url, userScript) {
    let props = {
        id: tab.id,
        ua: config.USER_AGENT,
        script: userScript,
        hidden: false,
        url: url
    };

    return {
        type: "web",
        props: props,
        events: {
            log: ({message}) => {
                if (config.DEBUG_CONSOLE) {
                    log(message);
                }
            },
            titleDetermined: ({title}) => {
                tab.title = title;
            },
            didFinish: async sender => {
                // Nothing?
            },
            didStart: sender => {
                if (tab.selected) {
                    tab.parent.setURLView(sender.url);
                }
                tab.title = "Loading ...";
            },
            urlDidChange: async sender => {
                if (tab.selected) {
                    tab.parent.setURLView(sender.url);
                }
                tab.title = await evalScript(tab, "document.title", true);
            },
            exitApplication: () => {
                $app.close();
            },
            share: () => tab.parent.share(),
            scrap: () => tab.parent.scrap(),
            message: ({message, duration}) => {
                $ui.toast(message, duration || 3);
            },
            paste: () => {
                evalScript(tab,
                    `__keysnail__.insertText('${escape($clipboard.text)}', true)`,
                    false);
            },
            closeTab: () => {
                tab.parent.closeTab(tab);
            },
            createNewTab: () => {
                tab.parent.createNewTab(null, true);
            },
            selectNextTab: () => {
                tab.parent.selectNextTab();
            },
            selectPreviousTab: () => {
                tab.parent.selectPreviousTab();
            },
            focusLocationBar: () => {
                tab.parent.focusLocationBar();
            },
            copyText: ({text}) => {
                $clipboard.set({type: "public.plain-text", value: text});
            },
        },
        layout: (make, view) => {
            if (VERTICAL) {
                make.edges.equalTo(view.super).insets($insets(TOPBAR_HEIGHT, VERTICAL_TAB_WIDTH, 0, 0));
            } else {
                make.edges.equalTo(view.super).insets($insets(TOPBAR_HEIGHT + TAB_HEIGHT, 0, 0, 0));
            }
        }
    };
}

function createWidgetBookmarkListButton(browser) {
    return {
        type: "label",
        props: {
            text: "📖",
            textColor: $rgba(0, 122, 255, 1),
            font: $font(20),
            bgcolor: $color("clear")
        },
        events: {
            tapped: async () => {
                browser.showBookmark();
            }
        },
        layout: make => {
            make.top.inset(5);
            make.right.inset(55);
        }
    };
}

function createWidgetShareButton(browser) {
    return {
        type: "label",
        props: {
            text: "🔗",
            textColor: $rgba(0, 122, 255, 1),
            font: $font(20),
            bgcolor: $color("clear")
        },
        events: {
            tapped: async () => {
                browser.share();
            }
        },
        layout: make => {
            make.top.inset(5);
            make.left.inset(55);
        }
    };
}

function createWidgetExitButton(browser) {
    return {
        type: "label",
        props: {
            text: "×",
            textColor: $rgba(0, 122, 255, 1),
            font: $font(30),
            bgcolor: $color("clear")
        },
        events: {
            tapped: async () => {
                $app.close();
            }
        },
        layout: make => {
            make.top.inset(-3);
            make.left.inset(15);
        }
    };
}

function createWidgetURLInput(browser) {
    let originalURL = null;
    return {
        type: "input",
        props: {
            id: "url-input",
            textColor: $color(URL_COLOR),
            align: $align.center
        },
        layout: (make, view) => {
            make.top.inset(3);
            make.left.inset(100);
            make.height.equalTo(TOPBAR_HEIGHT - 8);
            make.width.equalTo(view.super.width).offset(-200);
        },
        events: {
            didBeginEditing: sender => {
                sender.align = $align.left;
                sender.textColor = $rgba(0, 0, 0, 1);
                originalURL = sender.text;
            },
            returned: sender => {
                sender.blur();
            },
            didEndEditing: sender => {
                sender.align = $align.center;
                sender.textColor = $color(URL_COLOR);
                if (originalURL !== sender.text) {
                    try {
                        browser.visitURL(sender.text);
                    } catch (x) {
                        alert(x);
                    }
                }
            }
        }
    };
}

function createWidgetTabButton(browser) {
    return {
        type: "label",
        props: {
            text: "+",
            textColor: $rgba(0, 122, 255, 1),
            font: $font(30),
            bgcolor: $color("clear")
        },
        events: {
            tapped: async () => {
                browser.createNewTab(null, true);
            }
        },
        layout: make => {
            make.top.inset(-5);
            make.right.inset(15);
        }
    };
}

function createWidgetTabList(browser) {
    const tabNames = browser.tabs.map(tab => tab.title);
    const tabTemplate = {
        props: {},
        views: [
            {
                type: "label",
                props: {
                    id: "tab-name",
                    align: $align.center,
                    font: $font(TAB_FONT_SIZE),
                    borderWidth: 1,
                    borderColor: $color("#777777")
                },
                layout: $layout.fill
            },
            {
                type: "button",
                props: {
                    id: "close-button",
                    icon: $icon(
                        "225",
                        $rgba(140, 140, 140, 0.8),
                        $size(TAB_CLOSE_BUTTON_SIZE, TAB_CLOSE_BUTTON_SIZE)
                    ),
                    bgcolor: $color("clear")
                },
                events: {
                    tapped: async () => {
                        browser.closeTab(browser.tabs[browser.currentTabIndex]);
                    }
                },
                layout: (make, view) => {
                    make.left.equalTo(view.super.left).offset(5);
                    make.top.inset(5);
                }
            }
        ]
    };

    const data = tabNames.map((name, index) => {
        if (index === browser.currentTabIndex) {
            return {
                "tab-name": {
                    text: name,
                    bgcolor: $color(TAB_BG_SELECTED),
                    textColor: $color(TAB_FG_SELECTED),
                    tabIndex: index
                }
            };
        } else {
            return {
                "tab-name": {
                    text: name,
                    bgcolor: $color(TAB_BG_INACTIVE),
                    textColor: $color(TAB_FG_INACTIVE),
                    tabIndex: index
                },
                "close-button": {
                    hidden: true
                }
            };
        }
    });

    if (VERTICAL) {
        return {
            type: "list",
            events: {
                didSelect: (sender, indexPath) => {
                    browser.selectTab(indexPath.row);
                }
            },
            props: {
                id: "pages-tab",
                rowHeight: TAB_HEIGHT,
                // spacing: 0,
                template: tabTemplate,
                data: data,
                bgcolor: $color(TAB_LIST_BG),
                borderWidth: 1,
                borderColor: $color(TAB_FG_INACTIVE)
            },
            layout: (make, view) => {
                make.width.equalTo(VERTICAL_TAB_WIDTH);
                make.height.equalTo(view.super.height).offset(-TOPBAR_HEIGHT);
                make.top.equalTo(TOPBAR_HEIGHT);
                make.left.equalTo(0);
            }
        };
    } else {
        return {
            type: "matrix",
            events: {
                didSelect: (sender, indexPath) => {
                    browser.selectTab(indexPath.row);
                }
            },
            props: {
                id: "pages-tab",
                columns: tabNames.length,
                itemHeight: TAB_HEIGHT,
                spacing: 0,
                template: tabTemplate,
                data: data
            },
            layout: (make, view) => {
                make.width.equalTo(view.super.width);
                make.height.equalTo(TAB_HEIGHT);
                make.top.equalTo(TOPBAR_HEIGHT);
                make.left.equalTo(0);
            }
        };
    }
}

// -------------------------------------------------------------------- //
// Tab class
// -------------------------------------------------------------------- //

class Tab {
    constructor(parent, url = "http://www.google.com", userScript = "") {
        this.parent = parent;
        this.id =
            "tab-" +
            $objc("NSUUID")
                .$UUID()
                .$UUIDString()
                .rawValue();
        this._title = "";
        this.elementSource = createWidgetTabContent(this, url, userScript);
    }

    get selected() {
        const browser = this.parent;
        return this === browser.selectedTab;
    }

    focus() {
        // https://github.com/WebKit/webkit/blob/39a299616172a4d4fe1f7aaf573b41020a1d7358/Source/WebKit/UIProcess/API/Cocoa/WKWebView.mm#L1318
        let webView = this.element.runtimeValue();
        webView.$becomeFirstResponder();
        webView.$setAllowsBackForwardNavigationGestures(true);
    }

    get url() {
        return this.element.url;
    }

    /**
     * Get JSBox view element
     */
    get element() {
        let element = $(this.id);
        return element;
    }

    /**
     * Get title of current content page of the tab
     */
    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
        this.parent._updateTabView();
    }

    showBookmark() {
        evalScript(this, "__keysnail__.startSiteSelector(true)");
    }

    visitURL(url) {
        log("Visit " + url);
        this.element.url = url;
    }

    dispatchCtrlSpace() {
        evalScript(this, `__keysnail__.dispatchKey("ctrl- ", false, true)`);
    }
}

// -------------------------------------------------------------------- //
// Browser class
// -------------------------------------------------------------------- //

class TabBrowser {
    /**
     * Tab browser (maintain collection of tabs)
     */

    constructor(userScript, onInitialize) {
        this.userScript = userScript;
        this.currentTabIndex = 0;
        this.tabs = [];

        let browser = this;

        const {generateKeyCommands} = require("scripts/system-remap");
        const keymap = {
            // "ctrl-g": () => alert("huga!")
        };


        // Render UI
        $ui.render({
            props: {
                id: "browser-container",
                title: "iKeySnail",
                statusBarHidden: config.HIDE_STATUSBAR,
                navBarHidden: config.HIDE_TOOLBAR,
                keyCommands: generateKeyCommands(keymap),
                bgcolor: $rgba(250, 250, 250, 0.9),
            },
            events: {
                appeared: sender => {
                    onInitialize(this);
                }
            },
            views: [
                createWidgetTabButton(browser),
                createWidgetBookmarkListButton(browser),
                createWidgetShareButton(browser),
                createWidgetURLInput(browser),
                createWidgetExitButton(browser)
            ]
        });
    }

    get selectedTab() {
        return this.tabs[this.currentTabIndex];
    }

    setURLView(url) {
        try {
            $("url-input").text = decodeURIComponent(url);
        } catch (x) {
            console.error(x);
        }
    }

    visitURL(url) {
        this.selectedTab.visitURL(url);
    }

    showBookmark() {
        this.selectedTab.showBookmark();
    }

    _appendElementToView(elementSource) {
        this.ui = $("browser-container");
        this.ui.add(elementSource);
    }

    focusLocationBar() {
        $("url-input").focus();
        $("url-input")
            .runtimeValue()
            .$selectAll();
    }

    share() {
        let tab = this.selectedTab;
        $share.sheet([tab.url, tab.title]);
    }

    scrap() {
        let tab = this.selectedTab;
        let content = `#bookmark

${tab.url}
`;

        this.createNewTab(
            `https://scrapbox.io/stillpedant/${encodeURIComponent(
                tab.title
            )}?body=${encodeURIComponent(content)}`
        );
    }

    /**
     * タブを閉じる
     * @param {*} tab 閉じるタブ
     */
    closeTab(tab) {
        if (this.tabs.length <= 1) {
            this.tabs[0].visitURL(config.NEW_PAGE_URL);
        } else {
            tab.visitURL(null); // Expect early GC
            let index = this.tabs.indexOf(tab);
            tab.element.remove();
            if (index >= 0) {
                this.tabs.splice(index, 1);
            }
            this.selectTab(Math.max(0, this.currentTabIndex - 1));
        }
    }

    /**
     * タブを新規に作成
     * @param {string} url
     * @param {boolean} selectNewTab
     */
    createNewTab(url, selectNewTab = false) {
        if (!url) {
            url = config.NEW_PAGE_URL;
        }
        let tab = new Tab(this, url, this.userScript);
        this._appendElementToView(tab.elementSource);
        this.tabs.push(tab);
        if (selectNewTab) {
            this.selectTab(this.tabs.length - 1);
        } else {
            this._updateTabView();
        }
    }

    /**
     * 現在の状態に合わせて UI を更新
     */
    _updateTabView() {
        if (this.tabs.length) {
            let tabIndex = this.currentTabIndex;
            this._updateTabContentVisibility(tabIndex);
            this._updateTabListAppearance(tabIndex);
        }
    }

    /**
     * WebView -> currentTabIndex 以外の tab content を隠す
     */
    _updateTabContentVisibility(tabIndexToShow) {
        this.tabs.forEach((tab, index) => {
            if (tab.element) {
                tab.element.hidden = index !== tabIndexToShow;
            }
        });
    }

    /**
     * タブ表示部分を更新
     * @param {int} tabIndexToShow
     * @param {[string]} tabNames
     */
    _updateTabListAppearance(tabIndexToShow) {
        function removeIfExists(id) {
            try {
                let element = $(id);
                if (element) {
                    element.remove();
                }
            } catch (x) {
                log("Error in removing tab list: " + x);
            }
        }

        removeIfExists("pages-tab");
        let source = createWidgetTabList(this);
        this._appendElementToView(source);
    }

    selectTab(tabIndexToSelect) {
        this.currentTabIndex = tabIndexToSelect;
        let tab = this.tabs[this.currentTabIndex];
        tab.focus();
        this.setURLView(tab.url);
        this._updateTabView();
    }

    /**
     * Select next tab
     */
    selectNextTab() {
        this.selectTab((this.currentTabIndex + 1) % this.tabs.length);
    }

    /**
     * Select previous tab
     */
    selectPreviousTab() {
        if (this.currentTabIndex - 1 < 0) {
            this.selectTab(this.tabs.length - 1);
        } else {
            this.selectTab(this.currentTabIndex - 1);
        }
    }
}

// Session to start
function startSession(urlToVisit) {
    let lastTabs = [];
    let lastTabIndex = 0;
    try {
        [lastTabs, lastTabIndex] = loadTabInfo();
    } catch (x) {
    }

    let browser = new TabBrowser(readUserScript(), () => {
        if (lastTabs.length) {
            log(JSON.stringify(lastTabs, null, 2));
            lastTabs.forEach(url => {
                let tab = new Tab(browser, url, browser.userScript);
                browser._appendElementToView(tab.elementSource);
                browser.tabs.push(tab);
            });
            browser.selectTab(lastTabIndex);
        } else {
            browser.createNewTab("https://www.google.com/");
        }
    });

    $app.listen({
        ready: () => {

            $define({
                type: "UIResponder",
                events: {
                    "_keyCommandForEvent:": evt => {
                        // Disable all shortcut keys of JSBox (Meta-w)
                        return null;
                    }
                }
            });

            if (config.CAPTURE_CTRL_SPACE) {
                let ctrlKey = false;
                // Workaround for capturing Ctrl-Space
                $define({
                    type: "WKWebView",
                    // type: "UIApplication",
                    events: {
                        // Swizzling handleKeyUIEvent doesn't work. We need to swizzle the private one (_handleXXX).
                        "_handleKeyUIEvent:": evt => {
                            const P = 19;
                            const N = 17;
                            const ESC = 41;
                            const CTRL = 224;
                            const G = 10;
                            const SPACE = 44;
                            let keyCode = evt.$__keyCode();
                            let pressed = evt.$__isKeyDown();
                            if (keyCode === CTRL) {
                                ctrlKey = pressed;
                            } else if (keyCode === SPACE) {
                                // Space key.
                                if (ctrlKey) {
                                    if (pressed) {
                                        // Ctrl + Space. Prevent default action by returning null.
                                        browser.selectedTab.dispatchCtrlSpace();
                                    }
                                    return null;
                                }
                            }
                            return self.$ORIG__handleKeyUIEvent(evt);
                        }
                    }
                });
            }
        },
        exit: () => {
            try {
                $objc("RedBoxCore").$cleanClass("UIResponder");
                if (config.CAPTURE_CTRL_SPACE) {
                    $objc("RedBoxCore").$cleanClass("WKWebView");
                    // $objc("RedBoxCore").$cleanClass("UIApplication");
                }
            } catch (x) {
                console.error(x);
            }
            saveTabInfo(browser);
        }
    });
}

/* $app.keyboardToolbarEnabled = false; */

/* $app.autoKeyboardEnabled = true; */

function decideURLToVisit() {
    let queryUrl = $context.query.url;
    for (let {alias, url} of config.sites) {
        if (alias === queryUrl) {
            return url;
        }
    }
    if (queryUrl) {
        return queryUrl;
    }
    return null;
}

startSession(decideURLToVisit());
