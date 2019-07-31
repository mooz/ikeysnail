const config = { sites: [] };
require("./strings/settings").setup(config, { marked: () => null });

const VERTICAL = config.TAB_VERTICAL;
const VERTICAL_TAB_WIDTH = config.TAB_VERTICAL_WIDTH;
const TOPBAR_HEIGHT = 35;
const TAB_HEIGHT = 30;

const SIZE_TAB_FONT = 13;

const SIZE_TAB_CLOSE_ICON_BUTTON = 15;
const SIZE_TOPBAR_ICON_BUTTON = 18;

const TOPBAR_FIRSTROW_OFFSET = 5;

// URL Bar
const URLBAR_HEIGHT = TOPBAR_HEIGHT - 10;
const URLBAR_RATIO = 0.6;

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

function getQueryCompletionsFromWeb(query) {
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

// TODO: Make the off-the-ui-thread
// TODO: Or use sqlite!
function findPageEntriesByQuery(query, urls, titles,
                                reverse=false,
                                caseInsensitive=false,
                                RESULTS_COUNT_LIMIT=5) {
  if (caseInsensitive) {
    query = query.toLowerCase();
  }

  return new Promise((resolve, reject) => {
    let matchedIndices = [];
    let index;
    for (let i = 0; i < urls.length; ++i) {
      // Reverse order (e.g., for histories, it's natural to show last ones)
      index = reverse ? urls.length - 1 - i : i;
      // Don't match to http part (because it's obvious)
      let url = urls[index].replace(/^https?:\/\//, "");
      let title = titles[index];
      if (caseInsensitive) {
        title = title.toLowerCase();
      }
      if (url.indexOf(query) >= 0 || title.indexOf(query) >= 0) {
        matchedIndices.push(index);
        if (matchedIndices.length >= RESULTS_COUNT_LIMIT) {
          resolve(matchedIndices);
          return;
        }
      }
    }
    resolve(matchedIndices);
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
        tab.parent.addHistory(tab.url, tab.title);
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
        tab.parent.createNewTab(convertURLLikeInputToURL(url), true);
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
    // TODO: Add bookmark search (sites).
    const [[_, suggestions], historyIndices, tabIndices] = await Promise.all([
      getQueryCompletionsFromWeb(query),
      findPageEntriesByQuery(
        query,
        browser._pastURLs,
        browser._pastTitles,
        (reverse = true),
        (caseInsensitive = true)
      ),
      findPageEntriesByQuery(
        query,
        browser.tabs.map(tab => tab.url),
        browser.tabs.map(tab => tab.title),
        (reverse = false),
        (caseInsensitive = true)
      )
    ]);

    const NUM_CANDIDATE_MAX = 5;

    if (!sender.ks_shouldHideSuggestions) {
      browser.suggestions = {
        completion: suggestions.slice(0, NUM_CANDIDATE_MAX),
        history: {
          urls: historyIndices.map(i => browser._pastURLs[i]),
          titles: historyIndices.map(i => browser._pastTitles[i])
        },
        tab: {
          indices: tabIndices,
          urls: tabIndices.map(i => browser.tabs[i].url),
          titles: tabIndices.map(i => browser.tabs[i].title)
        }
      };
    }
  }, 200);

  return {
    type: "input",
    props: {
      id: "url-input",
      textColor: $color(URL_COLOR),
      // bgcolor: $color("EEEEEE"),
      align: $align.center
    },
    layout: (make, view) => {
      make.top.inset(TOPBAR_FIRSTROW_OFFSET);
      make.height.equalTo(URLBAR_HEIGHT);
      make.width.equalTo(view.super.width).multipliedBy(URLBAR_RATIO);
      make.centerX.equalTo(view.super.center);
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
        browser.decideCandidate();
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
        bgcolor: TAB_LIST_BG,
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

function createWidgetCompletions(browser, candidates, selectedIndex) {
  const LABEL_HEIGHT = TAB_HEIGHT + 5;
  const COMP_HEIGHT = LABEL_HEIGHT + 5;

  const template = {
    props: {},
    views: [
      {
        type: "view",
        props: {
          id: "completion-rectangle",
          bgcolor: $color("#FFFFFF")
        },
        layout: $layout.fill
      },
      {
        type: "button",
        props: {
          id: "completion-icon",
          bgcolor: $color("clear")
        },
        layout: (make, view) => {
          make.top.inset(10);
          make.left.inset(10);
        }
      },
      {
        type: "label",
        props: {
          id: "completion-label",
          align: $align.left,
          font: $font(15),
          borderWidth: 0,
          textColor: $color("#000000")
        },
        layout: (make, view) => {
          make.top.inset(3);
          make.left.inset(32);
          make.width.equalTo(view.super.width);
        }
      },
      {
        type: "label",
        props: {
          id: "completion-url",
          align: $align.left,
          font: $font(12),
          textColor: $rgba(0, 0, 0, 0.6)
        },
        layout: (make, view) => {
          make.bottom.inset(3);
          make.left.inset(32);
          make.width.equalTo(view.super.width);
        }
      }
    ]
  };

  const data = candidates.map((candidate, index) => {
    let label = null;
    if (candidate.type === "suggestion") {
      label = {
        "completion-label": {
          text: candidate.value,
          tabIndex: index
        },
        "completion-url": {
          text: "suggested by Google"
        },
        "completion-icon": {
          icon: $icon("023", $rgba(140, 140, 140, 0.8), $size(13, 13))
        }
      };
    } else if (candidate.type === "history" || candidate.type === "tab") {
      label = {
        "completion-label": {
          text: candidate.title,
          tabIndex: index
        },
        "completion-url": {
          text: candidate.value.replace(/^https?:\/\//, "")
        },
        "completion-icon": {
          icon: $icon(
            candidate.type === "history" ? "099" : "026",
            $rgba(140, 140, 140, 0.8),
            $size(13, 13)
          )
        }
      };
    } else {
      throw "Error. Unknown candidate.";
    }

    if (index === selectedIndex) {
      label["completion-rectangle"] = {
        bgcolor: $color("#DDDDDD")
      };
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
      make.top.inset(TOPBAR_HEIGHT - 4);
      make.height.equalTo(COMP_HEIGHT * candidates.length);
      make.width.equalTo(view.super.width).multipliedBy(URLBAR_RATIO);
      make.centerX.equalTo(view.super.center);
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
    this._pastURLs = [];
    this._pastTitles = [];

    let browser = this;

    // Render UI
    $ui.render({
      props: {
        id: "browser-container",
        title: "iKeySnail",
        statusBarHidden: config.HIDE_STATUSBAR,
        navBarHidden: config.HIDE_TOOLBAR,
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
          props: { bgcolor: COLOR_TAB_LIST_BG },
          layout: function(make, view) {
            if (VERTICAL) {
              make.top.equalTo(TOPBAR_HEIGHT + (VERTICAL ? 0 : TAB_HEIGHT));
              make.left.equalTo(0);
              make.height.equalTo(1);
              make.width.equalTo(view.super.width);
            } else {
              make.top.equalTo(TOPBAR_HEIGHT + (VERTICAL ? 0 : TAB_HEIGHT));
              make.left.equalTo(0);
              make.height.equalTo(1);
              make.width.equalTo(view.super.width);
            }
          }
        }
      ]
    });
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

  set suggestions(suggestionInfo) {
    try {
      this._suggestionList = null;
      if (suggestionInfo) {
        // Tabs
        let tabs = suggestionInfo.tab.titles.map((title, index) => {
          return {
            value: suggestionInfo.tab.urls[index],
            index: suggestionInfo.tab.indices[index],
            title: title,
            type: "tab"
          };
        });
        // History
        let history = suggestionInfo.history.titles.map((title, index) => {
          return {
            value: suggestionInfo.history.urls[index],
            title: title,
            type: "history"
          };
        });
        // Google autocompletion
        let completion = suggestionInfo.completion.map(title => ({
          value: title,
          type: "suggestion"
        }));

        // TODO: Order should be customizable
        this._suggestionList = tabs.concat(history.concat(completion));
      }

      this._suggestionIndex = -1;
      this._updateCandidateView();
    } catch (x) {
      console.error(x);
    }
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
      let cand = this._suggestionList[index];
      if (cand.type === "tab") {
        this.selectTab(cand.index);
      } else {
        $("url-input").text = cand.value;
      }
    }
    // TODO: not blur?
    // this.blurLocationBar();
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
    browser.history = loadHistory();

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
      if (urlToVisit) {
        browser.createNewTab(urlToVisit, true);
      } else {
        browser.selectTab(lastTabIndex);
      }
    } else {
      browser.createNewTab(urlToVisit || config.NEW_TAB_URL, true);
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

      let inputElement = $("url-input").runtimeValue();

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
        "ctrl-p": () => browser.selectPreviousCandidate(),
        "ctrl-n": () => browser.selectNextCandidate(),
        "ctrl-m": () => browser.decideCandidate(),
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
