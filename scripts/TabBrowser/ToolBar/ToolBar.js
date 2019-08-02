const {Component} = require("../../Component");

class ToolBar extends Component {
    constructor(height) {
        super();
        this._height = height;
    }

    build() {
        return {
            type: "view",
            props: {
                bgcolor: $color("clear")
            },
            layout: (make, view) => {
                make.width.equalTo(view.super);
                make.height.equalTo(this._height);
            }
        }
    }
}

exports.ToolBar = ToolBar;