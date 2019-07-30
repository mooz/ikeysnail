const config = { sites: [] };
require("./strings/settings").setup(config, { marked: () => null });

const VERTICAL = config.TAB_VERTICAL;
const VERTICAL_TAB_WIDTH = config.TAB_VERTICAL_WIDTH;
const TOPBAR_HEIGHT = 35;
const TAB_HEIGHT = 30;
const TAB_FONT_SIZE = 13;
const TAB_CLOSE_BUTTON_SIZE = 15;

const TOPBAR_FIRSTROW_OFFSET = 5;
const URLBAR_HEIGHT = TOPBAR_HEIGHT - 10;

const CONTAINER_BG = $rgba(250, 250, 250, 0.9);

const TAB_BG_SELECTED = $rgba(250, 250, 250, 0.9);
const TAB_FG_SELECTED = $color("#000000");

const TAB_BG_INACTIVE = $color("#cccccc");
const TAB_FG_INACTIVE = $color("#666666");

const TAB_LIST_BG = $color("#bbbbbb");
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
    tab.element.eval({ script: contentScript });
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
  try {
    let [tabURLs, tabIndex, tabNames] = JSON.parse($file.read("last-tabs.json").string.trim());
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

function readUserScript() {
  let userSettings = readMinified("./strings/settings");
  let contentScript = readMinified("./strings/content-script");
  return contentScript.replace(
    "/*@preserve SETTINGS_HERE*/",
    "\n" + userSettings + "\n"
  );
}

function understandURLLikeInput(url) {
  if (!/^https?:/.test(url)) {
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  return url;
}

function getSuggestions(query) {
  const completionURL =
    "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=" +
    encodeURIComponent(query);
  return new Promise((resolve, reject) => {
    $http.request({
      method: "GET",
      url: completionURL,
      handler: function(resp) {
        if (resp.error) {
          reject(resp.error);
        } else {
          resolve(resp.data);
        }
      }
    });
  });
}

// ------------------------------------------------------------------- //
// Widgets
// ------------------------------------------------------------------- //

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
      log: ({ message }) => {
        if (config.DEBUG_CONSOLE) {
          log(message);
        }
      },
      titleDetermined: ({ title }) => {
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
      message: ({ message, duration }) => {
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
      copyText: ({ text }) => {
        $clipboard.set({ type: "public.plain-text", value: text });
      },
      openClipboardURL: async () => {
        let url = await evalScript(tab, `__keysnail__.getSelectedText()`);
        if (!url) {
          url = $clipboard.text;
        }
        url = understandURLLikeInput(url);
        tab.parent.createNewTab(url, true);
      },
      selectTabsByPanel: () => {
        let candidates = tab.parent.tabs.map((tab, index) => ({
          text: tab.title,
          url: tab.url
        }));
        let initialIndex = tab.parent.tabs.indexOf(tab);
        evalScript(
          tab,
          `
__keysnail__.runPanel(${JSON.stringify(candidates)}, {
  toggle: true,
  initialIndex: ${initialIndex},
  action: index => $notify("selectTabByIndex", { index })
});
        `
        );
      },
      selectTabByIndex: ({ index }) => {
        tab.parent.selectTab(index);
      }
    },
    layout: (make, view) => {
      if (VERTICAL) {
        make.edges
          .equalTo(view.super)
          .insets($insets(TOPBAR_HEIGHT + 1, VERTICAL_TAB_WIDTH, 0, 0));
      } else {
        make.edges
          .equalTo(view.super)
          .insets($insets(TOPBAR_HEIGHT + TAB_HEIGHT + 1, 0, 0, 0));
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
      make.top.inset(TOPBAR_FIRSTROW_OFFSET);
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
      make.top.inset(TOPBAR_FIRSTROW_OFFSET);
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
  const isURL = urlLike => /https?:\/\//.test(urlLike);

  let originalURL = null;

  function debounce(func, interval = 500) {
    let timer = null;
    return (...args) => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(async () => {
        func(...args);
      }, interval);
    };
  }

  const obtainSuggestions = debounce(async (query, sender) => {
    const [_, suggestions] = await getSuggestions(query);
    const NUM_CANDIDATE_MAX = 10;
    if (!sender.ks_shouldHideSuggestions) {
      browser.suggestions = suggestions.slice(0, NUM_CANDIDATE_MAX);
    }
  }, 200);

  return {
    type: "input",
    props: {
      id: "url-input",
      textColor: $color(URL_COLOR),
      align: $align.center
    },
    layout: (make, view) => {
      make.top.inset(TOPBAR_FIRSTROW_OFFSET);
      make.left.inset(100);
      make.height.equalTo(URLBAR_HEIGHT);
      make.width.equalTo(view.super.width).offset(-200);
    },
    events: {
      didBeginEditing: sender => {
        sender.ks_confirmed = false;
        sender.ks_shouldHideSuggestions = false;
        sender.align = $align.left;
        sender.textColor = $rgba(0, 0, 0, 1);
        originalURL = sender.text;
      },
      tapped: sender => {
        browser.focusLocationBar();
      },
      returned: sender => {
        sender.ks_confirmed = true;
        sender.blur();
      },
      didEndEditing: sender => {
        sender.ks_shouldHideSuggestions = true;
        browser.suggestions = null;
        sender.align = $align.center;
        sender.textColor = $color(URL_COLOR);

        if (!sender.ks_confirmed || /^[ \t]*$/.test(sender.text)) {
          // Recover original text
          sender.text = originalURL;
        } else if (originalURL !== sender.text) {
          browser.visitURL(sender.text);
          // TODO: Dirty hack for getting focus on the current tab.
          // becomeFirstResponder of the tab doesn't work. Better way?
          setTimeout(() => browser.selectedTab.select(), 100);
        }
      },
      changed: sender => {
        if (isURL(sender.text)) {
          return;
        }
        obtainSuggestions(sender.text, sender);
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
              font: $font(TAB_FONT_SIZE)
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
          bgcolor: TAB_BG_SELECTED,
          textColor: TAB_FG_SELECTED,
          tabIndex: index
        }
      };
    } else {
      return {
        "tab-name": {
          text: name
        },
        "tab-rectangle": {
          bgcolor: TAB_BG_INACTIVE,
          textColor: TAB_FG_INACTIVE,
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
        bgcolor: TAB_LIST_BG,
        borderWidth: 1,
        borderColor: TAB_FG_INACTIVE
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

function createWidgetCompletions(browser, candidates, selectedIndex) {
  const COMP_HEIGHT = TAB_HEIGHT + 5;

  const template = {
    props: {},
    views: [
      {
        type: "label",
        props: {
          id: "completion-label",
          align: $align.left,
          font: $font(20),
          borderWidth: 1,
          textColor: $color("#000000"),
          borderColor: $color("#FFFFFF"),
          bgcolor: $color("#FFFFFF")
        },
        layout: (make, view) => {
          make.top.inset(0);
          make.left.inset(0);
          make.height.equalTo(view.super.height);
          make.width.equalTo(view.super.width);
        }
      }
    ]
  };

  const data = candidates.map((name, index) => {
    let label = {
      "completion-label": {
        text: "   🔎  " + name,
        tabIndex: index
      }
    };
    if (index === selectedIndex) {
      label["completion-label"].bgcolor = $color("#DDDDDD");
    }
    return label;
  });

  return {
    type: "list",
    events: {
      didSelect: (sender, indexPath) => {
        browser.decideCandidate(indexPath.row);
      }
    },
    props: {
      id: "completion-list",
      rowHeight: COMP_HEIGHT,
      template: template,
      data: data,
      bgColor: TAB_LIST_BG,
      borderWidth: 1,
      radius: 3,
      borderColor: $color("#EEEEEE")
    },
    layout: (make, view) => {
      make.top.inset(TOPBAR_HEIGHT - 8 + 3);
      make.left.inset(100);
      make.height.equalTo(COMP_HEIGHT * candidates.length);
      make.width.equalTo(view.super.width).offset(-200);
    }
  };
}

// -------------------------------------------------------------------- //
// Tab class
// -------------------------------------------------------------------- //

class Tab {
  constructor(parent, url = "http://www.google.com", userScript = "") {
    this.parent = parent;
    this.userScript = userScript;
    this.id =
      "tab-" +
      $objc("NSUUID")
        .$UUID()
        .$UUIDString()
        .rawValue();
    this._title = url;
    this.url = url;
    this._loaded = false;
  }

  get selected() {
    const browser = this.parent;
    return this === browser.selectedTab;
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
      return config.NEW_PAGE_URL;
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
    this.parent._updateTabView();
  }

  showBookmark() {
    evalScript(this, "__keysnail__.startSiteSelector(true)");
  }

  visitURL(url) {
    this.url = url;
  }

  load() {
    if (this._loaded) return;
    let source = createWidgetTabContent(this, this.url, this.userScript);
    this.parent._appendElementToView(source);
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

    const { generateKeyCommands } = require("scripts/system-remap");
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
        bgcolor: CONTAINER_BG
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
        createWidgetExitButton(browser),
        {
          type: "view",
          props: { bgcolor: TAB_LIST_BG },
          layout: function(make, view) {
            make.top.equalTo(TOPBAR_HEIGHT + (VERTICAL ? 0 : TAB_HEIGHT));
            make.left.equalTo(0);
            make.height.equalTo(1);
            make.width.equalTo(view.super.width);
          }
        }
      ]
    });
  }

  set suggestions(val) {
    this._suggestionList = val;
    this._suggestionIndex = -1;
    this._updateCandidateView();
  }

  _updateCandidateView() {
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
    removeIfExists("completion-list");
    if (this._suggestionList) {
      this._appendElementToView(
        createWidgetCompletions(
          this,
          this._suggestionList,
          this._suggestionIndex
        )
      );
    }
  }

  decideCandidate(index) {
    $("url-input").ks_confirmed = true;
    if (typeof index !== "number") {
      index = this._suggestionIndex;
    }
    if (index >= 0) {
      $("url-input").text = this._suggestionList[index];
    }
    this.blurLocationBar();
  }

  selectNextCandidate() {
    if (this._suggestionIndex < 0) {
      this._suggestionIndex = 0;
    } else {
      this._suggestionIndex =
        (this._suggestionIndex + 1) % this._suggestionList.length;
    }
    this._updateCandidateView();
  }

  selectPreviousCandidate() {
    if (this._suggestionIndex < 0) {
      this._suggestionIndex = this._suggestionList.length - 1;
    } else {
      if (this._suggestionIndex - 1 < 0) {
        this._suggestionIndex = this._suggestionList.length - 1;
      } else {
        this._suggestionIndex = this._suggestionIndex - 1;
      }
    }
    this._updateCandidateView();
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
    url = understandURLLikeInput(url);
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

  focusLocationBar() {
    $("url-input").focus();
    $("url-input")
      .runtimeValue()
      .$selectAll();
  }

  blurLocationBar() {
    $("url-input").blur();
    this.selectedTab.select();
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

  let browser = new TabBrowser(readUserScript(), () => {
    if (lastTabs.length) {
      lastTabs.forEach(tabInfo => {
        let tab = new Tab(browser, tabInfo.url, browser.userScript);
        if (tabInfo.title) {
          tab._title = tabInfo.title;
        }
        browser._appendElementToView(tab.elementSource);
        browser.tabs.push(tab);
        if (!config.TAB_LAZY_LOADING) {
          tab.load();
        }
      });      
      browser.selectTab(lastTabIndex);
    } else {
      browser.createNewTab(config.NEW_TAB_URL, true);
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
