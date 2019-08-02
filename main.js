const config = { sites: [] };
require("./strings/settings").setup(config, { marked: () => null });

const {Component} = require("scripts/Component");
const {Tab} = require("scripts/TabBrowser/Tab/TabContentWebView");
const {ToolBar} = require("scripts/TabBrowser/ToolBar/ToolBar");
const {ToolBarButton} = require("scripts/TabBrowser/ToolBar/ToolBarButton");
const {ToolBarButtonContainer} = require("scripts/TabBrowser/ToolBar/ToolBarButtonContainer");
const {LocationBar} = require("./scripts/TabBrowser/ToolBar/LocationBar/LocationBar");
const {LocationBarCompletion} = require("./scripts/TabBrowser/ToolBar/LocationBar/LocationBarCompletion");

const VERTICAL = config.TAB_VERTICAL;
const VERTICAL_TAB_WIDTH = config.TAB_VERTICAL_WIDTH;
const TOPBAR_HEIGHT = 50;
const TAB_HEIGHT = 30;

const SIZE_TAB_FONT = 13;

const SIZE_TAB_CLOSE_ICON_BUTTON = 15;
const SIZE_TOPBAR_ICON_BUTTON = 18;

const TOPBAR_FIRSTROW_OFFSET = 5;

// blue
const COLOR_TOPBAR_BUTTON_FG = $color("#007AFF");

const COLOR_CONTAINER_BG = $rgba(250, 250, 250, 0.9);

const COLOR_TAB_BG_SELECTED = $rgba(250, 250, 250, 0.9);
const COLOR_TAB_FG_SELECTED = $color("#000000");

const COLOR_TAB_BG_INACTIVE = $color("#cccccc");
const COLOR_TAB_FG_INACTIVE = $color("#666666");

const COLOR_TAB_LIST_BG = $color("#bbbbbb");

function log(message) {
  if (config.DEBUG_CONSOLE) {
    console.log(message);
  }
}

function readMinified(prefix) {
  if ($file.exists(prefix + ".min.js")) {
    return $file.read(prefix + ".min.js").string;
  } else {
    return $file.read(prefix + ".js").string;
  }
}

// ----------------------------------------------------------- //
// Tab Info (TODO: class)
// ----------------------------------------------------------- //

function loadTabInfo() {
  try {
    let [tabURLs, tabIndex, tabNames] = JSON.parse(
      $file.read("last-tabs.json").string.trim()
    );
    if (tabURLs.length !== tabNames.length) throw "Invalid";
    return [tabURLs, tabIndex, tabNames];
  } catch (x) {
    return [[], 0, []];
  }
}

function saveTabInfo(browser) {
  let tabURLs = browser.tabs.map(tab => tab.url);
  let tabTitles = browser.tabs.map(tab => tab.title);
  let lastTabIndex = browser.currentTabIndex;
  let lastTabInfo = [tabURLs, lastTabIndex, tabTitles];
  $file.write({
    data: $data({ string: JSON.stringify(lastTabInfo) }),
    path: "last-tabs.json"
  });
}

// ----------------------------------------------------------- //
// History (TODO: class)
// ----------------------------------------------------------- //

function loadHistory() {
  try {
    let history = JSON.parse($file.read("history.json").string.trim());
    if (!Array.isArray(history.pages)) throw "Error";
    if (!Array.isArray(history.bookmarks)) throw "Error";
    return history;
  } catch (x) {
    return {
      page: {
        urls: [],
        titles: []
      },
      bookmark: []
    };
  }
}

function saveHistory(browser) {
  $file.write({
    data: $data({ string: JSON.stringify(browser.history) }),
    path: "history.json"
  });
}

// ----------------------------------------------------------- //
// User script
// ----------------------------------------------------------- //

function readUserScript() {
  let userSettings = readMinified("./strings/settings");
  let contentScript = readMinified("./strings/content-script");
  return contentScript.replace(
    "/*@preserve SETTINGS_HERE*/",
    "\n" + userSettings + "\n"
  );
}

// ----------------------------------------------------------- //
// Query processing
// ----------------------------------------------------------- //

function convertURLLikeInputToURL(url) {
  if (!/^https?:/.test(url)) {
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  return url;
}

function createWidgetTabList(browser) {
  const tabNames = browser.tabs.map(tab => tab.title);
  const tabTemplate = {
    props: {},
    views: [
      {
        type: "view",
        props: {
          id: "tab-rectangle"
        },
        layout: $layout.fill,
        views: [
          {
            type: "label",
            props: {
              id: "tab-name",
              align: $align.center,
              font: $font(SIZE_TAB_FONT)
            },
            layout: (make, view) => {
              make.height.equalTo(view.super.height);
              make.width.equalTo(view.super.width).offset(-30);
              make.left.equalTo(view.super.left).offset(25);
            }
          }
        ]
      },
      {
        type: "button",
        props: {
          id: "close-button",
          icon: $icon(
            "225",
            $rgba(140, 140, 140, 0.8),
            $size(SIZE_TAB_CLOSE_ICON_BUTTON, SIZE_TAB_CLOSE_ICON_BUTTON)
          ),
          bgcolor: $color("clear")
        },
        events: {
          tapped: async () => {
            browser.closeTab(browser.tabs[browser.currentTabIndex]);
          }
        },
        layout: (make, view) => {
          make.left.equalTo(view.super.left).offset(TOPBAR_FIRSTROW_OFFSET);
          make.top.inset(TOPBAR_FIRSTROW_OFFSET);
        }
      }
    ]
  };

  const data = tabNames.map((name, index) => {
    if (index === browser.currentTabIndex) {
      return {
        "tab-name": {
          text: name
        },
        "tab-rectangle": {
          bgcolor: COLOR_TAB_BG_SELECTED,
          textColor: COLOR_TAB_FG_SELECTED,
          tabIndex: index
        }
      };
    } else {
      return {
        "tab-name": {
          text: name
        },
        "tab-rectangle": {
          bgcolor: COLOR_TAB_BG_INACTIVE,
          textColor: COLOR_TAB_FG_INACTIVE,
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
        },
        didLongPress: (sender, indexPath) => {
          const commands = [
            ["Copy", () => browser.copyTabInfo(indexPath.row)],
            ["Close other tabs", () => browser.closeTabsBesides(indexPath.row)],
            [
              "Open in external browser",
              () => browser.openInExternalBrowser(indexPath.row)
            ]
          ];
          $ui.menu({
            items: commands.map(c => c[0]),
            handler: function(title, idx) {
              if (idx >= 0) {
                commands[idx][1]();
              }
            },
            finished: function(cancelled) {
              // nothing?
            }
          });
        }
      },
      props: {
        id: "pages-tab",
        rowHeight: TAB_HEIGHT,
        // spacing: 0,
        template: tabTemplate,
        data: data,
        bgcolor: COLOR_TAB_LIST_BG,
        borderWidth: 0
      },
      layout: (make, view) => {
        make.width.equalTo(VERTICAL_TAB_WIDTH);
        make.height.equalTo(view.super.height).offset(-(TOPBAR_HEIGHT + 1));
        make.top.equalTo(TOPBAR_HEIGHT + 1);
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
// Browser class
// -------------------------------------------------------------------- //

class TabBrowser extends Component {
  /**
   * Tab browser (maintain collection of tabs)
   */

  constructor(userScript, onInitialize, config) {
    super(null);

    this.config = config;
    this.userScript = userScript;
    this.currentTabIndex = 0;
    this.tabs = [];
    this._pastURLs = [];
    this._pastTitles = [];
    this._onInitialize = onInitialize;

    this.id = "browser-container";

    let browser = this;

     // Width ratio computation
    const LOCATION_WIDTH_RATIO = 0.5;
    const TOOLBAR_CONTAINER_WIDTH_RATIO = (1.0 - LOCATION_WIDTH_RATIO) / 2;

    let leftToolBar = new ToolBarButtonContainer("left", TOOLBAR_CONTAINER_WIDTH_RATIO);
    let rightToolBar = new ToolBarButtonContainer("right", TOOLBAR_CONTAINER_WIDTH_RATIO);

    let completion = new LocationBarCompletion(browser, TOPBAR_HEIGHT);
    const locationBar = new LocationBar(this, completion, LOCATION_WIDTH_RATIO);
    browser._locationBar = locationBar;
    completion.locationBar = locationBar;

    const toolbar = new ToolBar(TOPBAR_HEIGHT);
    this._toolbar = toolbar;

    rightToolBar.addChild(new ToolBarButton(rightToolBar, "rectangle.on.rectangle", () => browser.selectTabsByPanel()));
    rightToolBar.addChild(new ToolBarButton(rightToolBar, "plus", () => browser.createNewTab(null, true)));
    rightToolBar.addChild(new ToolBarButton(rightToolBar, "square.and.arrow.up", () => browser.share()));

    leftToolBar.addChild(new ToolBarButton(leftToolBar, "multiply", () => $app.close()));
    leftToolBar.addChild(new ToolBarButton(leftToolBar, "chevron.left", () => browser.goBack()));
    leftToolBar.addChild(new ToolBarButton(leftToolBar, "chevron.right", () => browser.goForward()));
    leftToolBar.addChild(new ToolBarButton(leftToolBar, "book", () => browser.showBookmark()));

    // Declare view relationship
    toolbar.addChild(leftToolBar);
    toolbar.addChild(locationBar);
    toolbar.addChild(rightToolBar);

    browser.addChild(toolbar);

    browser.addChild(completion);

    // Render UI
    this.render();
  }

  build() {
    let browser = this;

    return {
      props: {
        id: this.id,
        title: "iKeySnail",
        statusBarHidden: this.config.HIDE_STATUSBAR,
        navBarHidden: this.config.HIDE_TOOLBAR,
        bgcolor: COLOR_CONTAINER_BG
      },
      events: {
        appeared: sender => {
          this._onInitialize(this);
        }
      }
    };
  }

  focusLocationBar() {
    this._locationBar.focus();
  }

  blurLocationBar() {
    this._locationBar.blur();
  }

  decideLocationBarCandidate() {
    this._locationBar.decideCandidate();
  }

  selectLocationBarNextCandidate() {
    this._locationBar.selectNextCandidate();
  }

  selectLocationBarPreviousCandidate() {
    this._locationBar.selectPreviousCandidate();
  }

  get history() {
    return {
      page: {
        urls: this._pastURLs,
        titles: this._pastTitles
      },
      bookmark: {}
    };
  }

  set history(val) {
    this._pastURLs = val.page.urls;
    this._pastTitles = val.page.titles;
    this._bookmark = val.bookmark;
  }

  addHistory(tabURL, tabName) {
    this._pastURLs.push(tabURL);
    this._pastTitles.push(tabName);
  }

  get bookmarks() {
    return this.config.sites.map(site => ({
      title: site.alias,
      url: site.url
    }));
  }

  get selectedTab() {
    return this.tabs[this.currentTabIndex];
  }

  selectTabsByPanel() {
    let browser = this;
    let candidates = browser.tabs.map((tab, index) => ({
      text: tab.title,
      url: tab.url
    }));
    let initialIndex = browser.tabs.indexOf(this.selectedTab);
    this.selectedTab.evalScript(`
__keysnail__.runPanel(${JSON.stringify(candidates)}, {
  toggle: true,
  initialIndex: ${initialIndex},
  action: index => $notify("selectTabByIndex", { index })
});
        `);
  }

  onTabStartLoading(tab) {
    if (tab === this.selectedTab) {
      this.setURLView(tab.url);
    }
  }

  onTabTitleDetermined(tab) {
    this.addHistory(tab.url, tab.title);
  }

  onTabURLChanged(tab) {
    if (tab === this.selectedTab) {
      this.setURLView(tab.url);
    }
  }

  focusContent() {
    this.selectedTab.select();
  }

  setURLView(url) {
    this._locationBar.setURLText(url);
  }

  visitURL(url) {
    url = convertURLLikeInputToURL(url);
    this.selectedTab.visitURL(url);
    this.setURLView(url);
    this.selectedTab.select();
  }

  showBookmark() {
    this.selectedTab.showBookmark();
  }

  _appendElementToView(elementSource) {
    this.ui = $("browser-container");
    this.ui.add(elementSource);
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
      )}?body=${encodeURIComponent(content)}`,
      true
    );
  }

  copyTabInfo(tabIndex) {
    $clipboard.set({
      type: "public.plain-text",
      value: this.tabs[tabIndex].url
    });
  }

  openInExternalBrowser(tabIndex) {
    $app.openURL(this.tabs[tabIndex].url);
  }

  closeTabsBesides(tabIndexToRetain) {
    let tabToRetain = this.tabs[tabIndexToRetain];
    this.tabs.forEach((tab, index) => {
      if (index !== tabIndexToRetain && tab.loaded) {
        tab.visitURL(null); // Expect early GC
        tab.element.remove();
      }
    });
    this.tabs = [tabToRetain];
    this.selectTab(0);
  }

  /**
   * タブを閉じる
   * @param {*} tab 閉じるタブ
   */
  closeTab(tab) {
    if (this.tabs.length <= 1) {
      this.tabs[0].visitURL(this.config.NEW_PAGE_URL);
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
      url = this.config.NEW_PAGE_URL;
    }
    let tab = new Tab(
        this,
        this.config,
        url,
        this.userScript
    );
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
    this.setURLView(tab.url);
    tab.select();
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
  let tabTitles = null;
  try {
    let [tabUrls, tabIndex, tabTitles] = loadTabInfo();
    lastTabIndex = tabIndex;
    tabTitles = tabTitles || [];
    for (let i = 0; i < tabUrls.length; ++i) {
      lastTabs.push({ url: tabUrls[i], title: tabTitles[i] });
    }
  } catch (x) {}

  let browser = new TabBrowser(readUserScript(), (browser) => {
    browser.history = loadHistory();


    if (lastTabs.length) {
      lastTabs.forEach(tabInfo => {
        let tab = new Tab(browser, config, tabInfo.url, browser.userScript);
        if (tabInfo.title) {
          tab._title = tabInfo.title;
        }
        browser._appendElementToView(tab.elementSource);
        browser.tabs.push(tab);
        if (!config.TAB_LAZY_LOADING) {
          tab.load();
        }
      });
      if (urlToVisit) {
        browser.createNewTab(urlToVisit, true);
      } else {
        browser.selectTab(lastTabIndex);
      }
    } else {
      browser.createNewTab(urlToVisit || config.NEW_TAB_URL, true);
    }
  }, config);

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

      let inputElement = browser._locationBar.runtime;

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
      if (config.SWAP_COMMAND_OPTION) {
        let originalOption = key.option;
        key.option = key.meta;
        key.meta = originalOption;
      }
      Object.freeze(key);
      const codeToKey = flip(key);

      let urlBarCommands = {
        "ctrl-p": () => browser.selectLocationBarPreviousCandidate(),
        "ctrl-n": () => browser.selectLocationBarNextCandidate(),
        "ctrl-m": () => browser.decideLocationBarCandidate(),
        "ctrl-g": () => browser.blurLocationBar(),
        Escape: () => browser.blurLocationBar()
      };

      let defaultCommands = {
        "ctrl-meta-j": () => browser.selectNextTab(),
        "ctrl-meta-k": () => browser.selectPreviousTab(),
        "meta-l": () => browser.focusLocationBar()
      };

      if (config.CAPTURE_CTRL_SPACE) {
        defaultCommands["ctrl- "] = () =>
          browser.selectedTab.dispatchCtrlSpace();
      }

      // Workaround for capturing Ctrl-Space
      $define({
        // type: "WKWebView",
        type: "UIApplication",
        events: {
          // Swizzling handleKeyUIEvent doesn't work. We need to swizzle the private one (_handleXXX).
          "_handleKeyUIEvent:": evt => {
            const keyCode = evt.$__keyCode();
            const pressed = evt.$__isKeyDown();
            const keyString = codeToKey[keyCode];

            if (!codeToKey.hasOwnProperty(keyCode)) {
              return self.$ORIG__handleKeyUIEvent(evt);
            }

            // Decide keymap
            let commands = defaultCommands;
            if (inputElement.$isFirstResponder()) {
              commands = urlBarCommands;
            }

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

              if (commands.hasOwnProperty(completeKeyString)) {
                if (
                  completeKeyString === "ctrl-m" &&
                  inputElement.$markedTextRange()
                ) {
                  // TODO: doesn't work
                  return self.$ORIG__handleKeyUIEvent(evt);
                }

                if (pressed) {
                  // $ui.toast("Exec command for " + completeKeyString);
                  try {
                    commands[completeKeyString]();
                  } catch (x) {}
                }
                return null;
              }
            }
            return self.$ORIG__handleKeyUIEvent(evt);
          }
        }
      });
    },
    exit: () => {
      try {
        $objc("RedBoxCore").$cleanClass("UIResponder");
        // $objc("RedBoxCore").$cleanClass("WKWebView");
        $objc("RedBoxCore").$cleanClass("UIApplication");
      } catch (x) {
        console.error(x);
      }
      saveTabInfo(browser);
      saveHistory(browser);
    }
  });
}

/* $app.keyboardToolbarEnabled = false; */

/* $app.autoKeyboardEnabled = true; */

function decideURLToVisit() {
  let queryUrl = $context.query.url;
  for (let { alias, url } of config.sites) {
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
