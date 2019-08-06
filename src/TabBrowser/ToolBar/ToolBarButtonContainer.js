const {Component} = require("../../Component");


class ToolBarButtonContainer extends Component {
    constructor(align="left",
                WIDTH_RATIO=0.5,
                bgcolor=$color("clear")) {
        super();
        this._align = align;
        this._bgcolor = bgcolor;
        this.WIDTH_RATIO = WIDTH_RATIO;
    }

    get align() { return this._align; }

    build() {
        return {
            type: "view",
            props: {
                bgcolor: this._bgcolor
            },
            layout: (make, view) => {
                make.top.equalTo(view.super.top);
                make.height.equalTo(view.super.height);
                make.width.equalTo(view.super.width).multipliedBy(this.WIDTH_RATIO);

                if (this._align === "left") {
                    make.left.inset(0);
                } else {
                    make.right.inset(0);
                }
            }
        };
    }
}

exports.ToolBarButtonContainer = ToolBarButtonContainer;
