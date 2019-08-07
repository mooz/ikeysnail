const {TabContentWebView} = require("TabBrowser/Tab/TabContentWebView");
const {Component} = require("Component");
const {ToolBar} = require("TabBrowser/ToolBar/ToolBar");
const {ToolBarButton} = require("TabBrowser/ToolBar/ToolBarButton");
const {ToolBarButtonContainer} = require("TabBrowser/ToolBar/ToolBarButtonContainer");
const {LocationBar} = require("TabBrowser/ToolBar/LocationBar/LocationBar");
const {LocationBarCompletion} = require("TabBrowser/ToolBar/LocationBar/LocationBarCompletion");
const {TabListHorizontal} = require("TabBrowser/TabList");
const {TabListVertical} = require("TabBrowser/TabList");


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
  let tabURLs = browser._tabs.map(tab => tab.url);
  let tabTitles = browser._tabs.map(tab => tab.title);
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

function loadConfig() {
    let userSettings = readMinified("./strings/settings");
    eval(userSettings);
    const config = {sites: []};
    exports.setup(config, {marked: () => null});
    return config;
}

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

// <TabAndContentContainer>
//   <TabList />
//   <TabContentHolder />
// </TabAndContentContainer>
class TabAndContentContainer extends Component {
    constructor(verticalOffset) {
        super();
        this._verticalOffset = verticalOffset;
    }

    build() {
        return {
            type: "view",
            props: {
                bgcolor: $color("clear"),
            },
            layout: (make, view) => {
                make.width.equalTo(view.super.width);
                make.height.equalTo(view.super.height).offset(-this._verticalOffset);
                make.top.equalTo(view.super.top).offset(this._verticalOffset);
                make.left.equalTo(view.super);
            }
        }
    }
}

class TabContentHolder extends Component {
    constructor(browser) {
        super();
        this.config = browser.config;
    }

    build() {
        return {
            type: "view",
            props: {
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                if (this.config.TAB_VERTICAL) {
                    make.width.equalTo(view.super.width).offset(-this.config.TAB_VERTICAL_WIDTH);
                    make.height.equalTo(view.super.height);
                    make.top.equalTo(view.super.top);
                    make.left.equalTo(view.super).offset(this.config.TAB_VERTICAL_WIDTH);
                } else {
                    make.width.equalTo(view.super.width);
                    make.height.equalTo(view.super.height);
                    make.top.equalTo(view.super.top).offset(this.config.TAB_HEIGHT);
                    make.left.equalTo(view.super);
               }
            }
        }
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
    super();
    this._config = config;

    this.userScript = userScript;
    this.currentTabIndex = 0;
    this._tabs = [];
    this._pastURLs = [];
    this._pastTitles = [];
    this._onInitialize = onInitialize;

    const TOPBAR_HEIGHT = config.TOPBAR_HEIGHT;

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

    const tabAndContentContainer = new TabAndContentContainer(TOPBAR_HEIGHT);
    this._tabAndContentContainer = tabAndContentContainer;

    // const tabListContentSeparator = ;

    const tabContentHolder = new TabContentHolder(browser);
    this._tabContentHolder = tabContentHolder;

    const tabList = config.TAB_VERTICAL ? new TabListVertical(browser) : new TabListHorizontal(browser);
    this._tabList = tabList;

      rightToolBar
          .addChild(new ToolBarButton("rectangle.on.rectangle", () => browser.selectTabsByPanel()))
          .addChild(new ToolBarButton("plus", () => browser.createNewTab(null, true)))
          .addChild(new ToolBarButton("square.and.arrow.up", () => browser.share()))
      ;

      leftToolBar
          .addChild(new ToolBarButton("multiply", () => $app.close()))
          .addChild(new ToolBarButton("chevron.left", () => browser.goBack()))
          .addChild(new ToolBarButton("chevron.right", () => browser.goForward()))
          .addChild(new ToolBarButton("book", () => browser.showBookmark()))
      ;

      // Declare view relationship
      toolbar
          .addChild(leftToolBar)
          .addChild(locationBar)
          .addChild(rightToolBar)
      ;

      tabAndContentContainer
          .addChild(tabList)
          .addChild(tabContentHolder);

      browser
          .addChild(completion)
          .addChild(toolbar)
          .addChild(tabAndContentContainer)
      ;

    // Render UI
    this.render();
  }

  get config() {
      return this._config;
  }

  build() {
    let browser = this;

    return {
      props: {
        id: this.id,
        title: "iKeySnail",
        statusBarHidden: this.config.HIDE_STATUSBAR,
        navBarHidden: this.config.HIDE_TOOLBAR,
        // bgcolor: COLOR_CONTAINER_BG
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
    return this._tabs[this.currentTabIndex];
  }

  selectTabsByPanel() {
    let candidates = this._tabs.map((tab, index) => ({
      text: tab.title,
      url: tab.url
    }));
    let initialIndex = this._tabs.indexOf(this.selectedTab);
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

  goBack() {
      this.selectedTab.goBack();
  }

  goForward() {
      this.selectedTab.goForward();
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
      `https://scrapbox.io/${this.config.SCRAPBOX_USER}/${encodeURIComponent(
        tab.title
      )}?body=${encodeURIComponent(content)}`,
      true
    );
  }

  copyTabInfo(tabIndex) {
    $clipboard.set({
      type: "public.plain-text",
      value: this._tabs[tabIndex].url
    });
  }

    openInExternalBrowser(tabIndex) {
    $app.openURL(this._tabs[tabIndex].url);
  }

  closeTabsBesides(tabIndexToRetain) {
    let tabToRetain = this._tabs[tabIndexToRetain];
    this._tabs.forEach((tab, index) => {
      if (index !== tabIndexToRetain && tab.loaded) {
        tab.destroy();
      }
    });
    this._tabs = [tabToRetain];
    this.selectTab(0);
  }

  /**
   * タブを閉じる
   * @param {*} tab 閉じるタブ
   */
  closeTab(tab) {
    if (this._tabs.length <= 1) {
      this._tabs[0].visitURL(this.config.NEW_PAGE_URL);
    } else {
      tab.visitURL(null); // Expect early GC
      let index = this._tabs.indexOf(tab);
      tab.removeMe();
      if (index >= 0) {
        this._tabs.splice(index, 1);
      }
      this.selectTab(Math.max(0, this.currentTabIndex - 1));
    }
  }
  
  _createNewTabInternal(url, tabTitle = null) {
    let tab = new TabContentWebView(
        this,
        this.config,
        url,
        this.userScript
    );
    if (tabTitle) {
        tab._title = tabTitle;
    }
    this._tabContentHolder.addChild(tab);
    this._tabs.push(tab);
    return tab;
  }
  
  /**
   * タブを新規に作成
   * @param {string} url
   * @param {boolean} selectNewTab
   */
  createNewTabs(urls, tabIndexToSelect = -1, titles = []) {
    urls.forEach((url, idx) => {
      let title = titles ? titles[idx] : null;
      this._createNewTabInternal(url, title);
    });
    if (tabIndexToSelect >= 0) {
      this.selectTab(tabIndexToSelect);
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
    let tab = this._createNewTabInternal(url);
    // TODO: Create rendering stop option
    if (selectNewTab) {
      this.selectTab(this._tabs.indexOf(tab));
    } else {
      this._tabAndContentContainer.render();
    }
  }

  selectTab(tabIndexToSelect) {
    this.currentTabIndex = tabIndexToSelect;
    // TODO: ugly?
    this._tabs.forEach((tab, index) => {
        if (index === tabIndexToSelect) {
            tab.select();
            this.setURLView(tab.url);
        } else {
            tab.deselect();
        }
    });
    this._tabList.render();
  }

  /**
   * Select next tab
   */
  selectNextTab() {
    this.selectTab((this.currentTabIndex + 1) % this._tabs.length);
  }

  /**
   * Select previous tab
   */
  selectPreviousTab() {
    if (this.currentTabIndex - 1 < 0) {
      this.selectTab(this._tabs.length - 1);
    } else {
      this.selectTab(this.currentTabIndex - 1);
    }
  }
}

// Session to start
function startSession(urlToVisit) {
    const config = loadConfig();

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
          browser.createNewTabs(
              lastTabs.map(t => t.url),
              lastTabIndex,
              lastTabs.map(t => t.title)
          );
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


startSession($context.query.url || null);
