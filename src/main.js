import { ShortcutKeyDeactivator, SystemKeyHandler } from "./Observer";
const { TabContentWebView } = require("TabBrowser/Tab/TabContentWebView");
const { Component } = require("Component");
const { ToolBar } = require("TabBrowser/ToolBar/ToolBar");
const { ToolBarButton } = require("TabBrowser/ToolBar/ToolBarButton");
const {
  ToolBarButtonContainer
} = require("TabBrowser/ToolBar/ToolBarButtonContainer");
const { LocationBar } = require("TabBrowser/ToolBar/LocationBar/LocationBar");
const {
  LocationBarCompletion
} = require("TabBrowser/ToolBar/LocationBar/LocationBarCompletion");
const { TabListHorizontal } = require("TabBrowser/TabList");
const { TabListVertical } = require("TabBrowser/TabList");

function readFile(file, initialContent = null) {
  if (!$file.exists(file)) {
    if (!initialContent) {
      throw file + " not found and initial content isn't specified";
    }
    $file.write({
      data: $data({
        string: initialContent
      }),
      path: file
    });
    return initialContent;
  }
  return $file.read(file).string;
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

const CONFIG_SYSTEM = "settings.default.js";
const CONFIG_USER = "settings.js";
const CONFIG_NAMES = [CONFIG_SYSTEM, CONFIG_USER];

function loadConfig() {
  const config = { sites: [] };
  const keysnail = { marked: () => null };
  const isContent = false;

  for (let fileName of CONFIG_NAMES) {
    let script = readFile(
      fileName,
      fileName === CONFIG_USER
        ? `// Put your configuration here. See ${CONFIG_SYSTEM} for configuration items.
`
        : null
    );
    if (script) {
      eval(script);

      console.log("Loading " + fileName + " -> done");
    } else {
      console.log("Loading " + fileName + " -> skipped (not found)");
    }
  }
  return config;
}

function readUserScript() {
  let userSettings = CONFIG_NAMES.map(f => readFile(f))
    .filter(s => !!s)
    .join("\n");
  let contentScript = readFile("./content-script.js");
  console.log(contentScript);
  let userScript = contentScript.replace(
    "/*@preserve SETTINGS_HERE*/",
    `function setup(config, keysnail, isContent) {
        ${userSettings}
      }`
  );
  console.log(userScript);
  return userScript;
}

// ----------------------------------------------------------- //
// Query processing
// ----------------------------------------------------------- //

function convertURLLikeInputToURL(url) {
  if (!/^https?:/.test(url) && url !== "about:blank") {
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
        bgcolor: $color("clear")
      },
      layout: (make, view) => {
        make.width.equalTo(view.super.width);
        make.height.equalTo(view.super.height).offset(-this._verticalOffset);
        make.top.equalTo(view.super.top).offset(this._verticalOffset);
        make.left.equalTo(view.super);
      }
    };
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
          make.width
            .equalTo(view.super.width)
            .offset(-this.config.TAB_VERTICAL_WIDTH);
          make.height.equalTo(view.super.height);
          make.top.equalTo(view.super.top);
          make.left.equalTo(view.super).offset(this.config.TAB_VERTICAL_WIDTH);
        } else {
          make.width.equalTo(view.super.width);
          make.height
            .equalTo(view.super.height)
            .offset(-this.config.TAB_HEIGHT);
          make.top.equalTo(view.super.top).offset(this.config.TAB_HEIGHT);
          make.left.equalTo(view.super);
        }
      }
    };
  }
}

class SearchBar extends Component {
  /***
   * @param {TabBrowser} browser
   */
  constructor(browser) {
    super();
    this._browser = browser;
    this.ID_TEXT_INPUT = "search-text-input";
  }

  get textInput() {
    return this.element.views[0];
  }

  get positionLabel() {
    return this.element.views[1];
  }

  next() {
    return this._browser.searchText(this.textInput.text);
  }

  previous() {
    return this._browser.searchText(this.textInput.text, true);
  }

  focus() {
    this.element.hidden = false;
    this.layer.$setZPosition(1); // Brings UI to top
    this.textInput.text = "";
    this.textInput.focus();
  }

  blur() {
    this._browser.searchText(""); // reset view
    this.element.hidden = true;
    this.layer.$setZPosition(-1); // Hide UI
    this.textInput.blur();
    this._browser.focusContent();
  }

  updatePositionInfo(info) {
    this.positionLabel.text = info;
  }

  build() {
    const height = 45;

    return {
      type: "view",
      props: {
        hidden: true,
        bgcolor: $color("#C6C8CE"),
        color: $color("#000000")
      },
      layout: (make, view) => {
        make.height.equalTo(height);
        make.width.equalTo(view.super.width);
        make.top.equalTo(0);
      },
      views: [
        {
          type: "input",
          id: this.ID_TEXT_INPUT,
          props: {
            textColor: $color("#000000"),
            bgcolor: $color("#D1D3D9"),
            radius: 10,
            align: $align.left
          },
          layout: (make, view) => {
            make.height.equalTo(height * 0.75);
            make.width.equalTo(view.super).multipliedBy(0.7);
            make.centerY.equalTo(view.super);
            make.centerX.equalTo(view.super);
          },
          events: {
            didBeginEditing: sender => {
              // focused
              this.positionLabel.text = "";
            },
            tapped: sender => {
              this.focus();
            },
            returned: sender => {
              this.next();
            },
            didEndEditing: sender => {
              this.blur();
            },
            changed: sender => {
              // TODO: debounce?
              this._browser.searchText(sender.text);
            }
          }
        },
        {
          type: "label",
          props: {
            textColor: $color("gray"),
            text: "",
            align: $align.right
          },
          layout: (make, view) => {
            make.right.equalTo(-20);
            make.centerY.equalTo(view.super);
          },
          events: {}
        }
      ]
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
    super();
    this._config = config;

    this.userScript = userScript;
    this.currentTabIndex = 0;
    this._tabs = [];
    this._closedTabs = [];
    this._pastURLs = [];
    this._pastTitles = [];
    this._onInitialize = onInitialize;

    const TOPBAR_HEIGHT = config.TOPBAR_HEIGHT;

    // Width ratio computation
    const LOCATION_WIDTH_RATIO = 0.5;
    const TOOLBAR_CONTAINER_WIDTH_RATIO = (1.0 - LOCATION_WIDTH_RATIO) / 2;

    let leftToolBar = new ToolBarButtonContainer(
      "left",
      TOOLBAR_CONTAINER_WIDTH_RATIO
    );
    let rightToolBar = new ToolBarButtonContainer(
      "right",
      TOOLBAR_CONTAINER_WIDTH_RATIO
    );

    let completion = new LocationBarCompletion(this, TOPBAR_HEIGHT);
    const locationBar = new LocationBar(this, completion, LOCATION_WIDTH_RATIO);
    this._locationBar = locationBar;
    completion.locationBar = locationBar;

    const toolbar = new ToolBar(TOPBAR_HEIGHT);
    this._toolbar = toolbar;

    const tabAndContentContainer = new TabAndContentContainer(TOPBAR_HEIGHT);
    this._tabAndContentContainer = tabAndContentContainer;

    const tabContentHolder = new TabContentHolder(this);
    this._tabContentHolder = tabContentHolder;

    const searchBar = new SearchBar(this);
    this._searchBar = searchBar;

    const tabList = config.TAB_VERTICAL
      ? new TabListVertical(this)
      : new TabListHorizontal(this);
    this._tabList = tabList;

    rightToolBar
      .addChild(
        new ToolBarButton("rectangle.on.rectangle", () =>
          this.selectTabsByPanel()
        )
      )
      .addChild(new ToolBarButton("plus", () => this.createNewTab(null, true)))
      .addChild(new ToolBarButton("square.and.arrow.up", () => this.share()));

    leftToolBar
      .addChild(new ToolBarButton("multiply", () => $app.close()))
      .addChild(new ToolBarButton("chevron.left", () => this.goBack()))
      .addChild(new ToolBarButton("chevron.right", () => this.goForward()))
      .addChild(new ToolBarButton("book", () => this.showBookmark()));

    // Declare view relationship
    toolbar
      .addChild(leftToolBar)
      .addChild(locationBar)
      .addChild(rightToolBar);

    tabContentHolder.addChild(searchBar);

    tabAndContentContainer.addChild(tabList).addChild(tabContentHolder);

    this.addChild(completion)
      .addChild(toolbar)
      .addChild(tabAndContentContainer);

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
        navBarHidden: this.config.HIDE_TOOLBAR
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

  focusFindBar() {
    this._searchBar.focus();
  }

  blurFindBar() {
    this._searchBar.blur();
  }

  findNext() {
    this._searchBar.next();
  }

  findPrevious() {
    this._searchBar.previous();
  }

  updateSearchPositionInfo(info) {
    this._searchBar.updatePositionInfo(info);
  }

  searchText(text, backward = false) {
    return this.selectedTab.searchText(text, backward);
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
    if (!this.config.SCRAPBOX_USER) {
      $ui.toast(
        `Specify Scrapbox user in settings.js: config.SCRAPBOX_USER = 'XXX';`
      );
      return;
    }

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
      this._closedTabs.push({
        url: tab.url,
        title: tab.title
      });
      if (index !== tabIndexToRetain && tab.loaded) {
        tab.visitURL(null);
        tab.removeMe();
      }
    });
    this._tabs = [tabToRetain];
    this.selectTab(0);
  }

  closeCurrentTab() {
    return this.closeTab(this._tabs[this.currentTabIndex]);
  }

  /**
   * タブを閉じる
   * @param {*} tab 閉じるタブ
   */
  closeTab(tab) {
    this._closedTabs.push({
      url: tab.url,
      title: tab.title
    });

    if (this._tabs.length <= 1) {
      this._tabs[0].visitURL(this.config.NEW_PAGE_URL);
    } else {
      tab.visitURL(null);
      let index = this._tabs.indexOf(tab);
      tab.removeMe();
      if (index >= 0) {
        this._tabs.splice(index, 1);
      }
      this.selectTab(Math.max(0, this.currentTabIndex - 1));
    }
  }

  _createNewTabInternal(url, tabTitle = null) {
    let tab = new TabContentWebView(this, this.config, url, this.userScript);
    if (tabTitle) {
      tab._title = tabTitle;
    }
    this._tabContentHolder.addChild(tab);
    this._tabs.push(tab);
    return tab;
  }

  createNewTabs(urls, tabIndexToSelect = -1, titles = []) {
    urls.forEach((url, idx) => {
      let title = titles ? titles[idx] : null;
      this._createNewTabInternal(url, title);
    });
    if (tabIndexToSelect >= 0) {
      this.selectTab(tabIndexToSelect);
    }
  }

  createNewTab(url, selectNewTab = false) {
    if (!url) {
      url = this.config.NEW_PAGE_URL;
    }
    url = convertURLLikeInputToURL(url);
    let tab = this._createNewTabInternal(url);
    // TODO: Create rendering stop option
    if (selectNewTab) {
      this.selectTab(this._tabs.indexOf(tab));
    } else {
      this._tabList.render();
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

  undoClosedTab() {
    if (!this._closedTabs.length) {
      $ui.toast("No closed tabs in the history", 0.7);
      return;
    }
    let tab = this._closedTabs.pop();
    this.createNewTab(tab.url, true);
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

  let browser = new TabBrowser(
    readUserScript(),
    browser => {
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
    },
    config
  );

  const shortcutKeyDeactivator = new ShortcutKeyDeactivator();
  const systemKeyHandler = new SystemKeyHandler(browser, config);

  $app.listen({
    ready: () => {
      shortcutKeyDeactivator.onReady();
      systemKeyHandler.onReady();
    },
    exit: () => {
      shortcutKeyDeactivator.onExit();
      systemKeyHandler.onExit();
      saveTabInfo(browser);
      saveHistory(browser);
    }
  });
}

/* $app.keyboardToolbarEnabled = false; */

/* $app.autoKeyboardEnabled = true; */

startSession($context.query.url || null);
