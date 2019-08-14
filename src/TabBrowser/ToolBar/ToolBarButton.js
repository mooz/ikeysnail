const { Component } = require("../../Component");

const SIZE_TOPBAR_ICON_BUTTON = 18;
const COLOR_TOPBAR_BUTTON_FG = $color("#007AFF");

class ToolBarButton extends Component {
  constructor(iconType, onTapped) {
    super();
    this._iconOrSymbol = iconType;
    this._onTapped = onTapped;
    this._padding = 30;
  }

  build() {
    const viewSource = {
      type: "button",
      props: {
        bgcolor: $color("clear")
      },
      events: {
        tapped: this._onTapped
      },
      layout: (make, view) => {
        // TODO: Better way?
        const siblings = this._parent.element.views;
        const nthChild = siblings.indexOf(view);
        if (this._parent.align === "left") {
          const basis =
            nthChild === 0 ? view.super.left : siblings[nthChild - 1].right;
          make.left.equalTo(basis).offset(this._padding);
        } else {
          const basis =
            nthChild === 0 ? view.super.right : siblings[nthChild - 1].left;
          make.right.equalTo(basis).offset(-this._padding);
        }
        make.centerY.equalTo(view.super);
        make.height.equalTo(view.super);
      }
    };

    if (/^[0-9]+$/.test(this._iconOrSymbol)) {
      // https://github.com/cyanzhong/xTeko/tree/master/extension-icons
      viewSource.props.icon = $icon(
        this._iconOrSymbol,
        COLOR_TOPBAR_BUTTON_FG,
        $size(SIZE_TOPBAR_ICON_BUTTON, SIZE_TOPBAR_ICON_BUTTON)
      );
    } else {
      // https://sfsymbols.com/
      // https://developer.apple.com/design/human-interface-guidelines/sf-symbols/overview/
      viewSource.props.symbol = this._iconOrSymbol;
      viewSource.props.tintColor = COLOR_TOPBAR_BUTTON_FG;
    }

    return viewSource;
  }
}

exports.ToolBarButton = ToolBarButton;
