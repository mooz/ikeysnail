const { Component } = require("Component");

const SIZE_TAB_CLOSE_ICON_BUTTON = 15;
// blue
const COLOR_TAB_BG_SELECTED = $rgba(250, 250, 250, 0.9);
const COLOR_TAB_FG_SELECTED = $color("#000000");
const COLOR_TAB_BG_INACTIVE = $color("#cccccc");
const COLOR_TAB_FG_INACTIVE = $color("#666666");
const COLOR_TAB_LIST_BG = $color("#bbbbbb");

class TabList extends Component {
  constructor(browser) {
    super();

    this.config = browser.config;
    this._browser = browser;
    this._eventHandlers = {
      didSelect: (sender, indexPath) => {
        this._browser.selectTab(indexPath.row);
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
    };

    this._tabTemplate = {
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
                font: $font(this.config.SIZE_TAB_FONT)
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
              browser.closeCurrentTab();
            }
          },
          layout: (make, view) => {
            make.left.equalTo(view.super.left).offset(5);
            make.top.inset(5);
          }
        }
      ]
    };
  }

  get tabNames() {
    let names = this._browser._tabs.map(tab => tab.title);
    return names;
  }

  get currentTabIndex() {
    return this._browser.currentTabIndex;
  }

  build() {
    const data = this.tabNames.map((name, index) => {
      if (index === this.currentTabIndex) {
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

    if (!data || data.length === 0) {
      return null;
    }

    return this._buildTabList(data);
  }
}

class TabListVertical extends TabList {
  constructor(browser) {
    super(browser);
    this.config = browser.config;
  }

  _buildTabList(data) {
    return {
      type: "list",
      events: this._eventHandlers,
      props: {
        id: "pages-tab",
        rowHeight: this.config.TAB_HEIGHT,
        // spacing: 0,
        template: this._tabTemplate,
        data: data,
        bgcolor: COLOR_TAB_LIST_BG,
        borderWidth: 0
      },
      layout: (make, view) => {
        make.width.equalTo(this.config.TAB_VERTICAL_WIDTH);
        make.height.equalTo(view.super);
        make.top.equalTo(view.super);
        make.left.equalTo(view.super);
      }
    };
  }
}

class TabListHorizontal extends TabList {
  constructor(browser) {
    super(browser);
    this.config = browser.config;
  }

  _buildTabList(data) {
    return {
      type: "matrix",
      events: this._eventHandlers,
      props: {
        id: "pages-tab",
        columns: data.length,
        itemHeight: this.config.TAB_HEIGHT,
        spacing: 0,
        template: this._tabTemplate,
        data: data
      },
      layout: (make, view) => {
        make.width.equalTo(view.super);
        make.height.equalTo(this.config.TAB_HEIGHT);
        make.top.equalTo(view.super);
        make.left.equalTo(view.super);
      }
    };
  }
}

exports.TabListHorizontal = TabListHorizontal;
exports.TabListVertical = TabListVertical;
