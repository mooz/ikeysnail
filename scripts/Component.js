/***
 * コンポーネント
 *
 * 全ての要素はこのコンポーネントにより実装される
 */
class Component {
    constructor() {
        this._parent = null;
        this.id = $objc("NSUUID")
            .$UUID()
            .$UUIDString()
            .rawValue();
        this._rendered = false;
        this.children = [];
        this._layout = null;
    }

    set layout(val) {
        this._layout = val;
    }

    get layout() {
        return this._layout;
    }

    get rendered() {
        return !!this.element;
    }

    get element() {
        return $(this.id);
    }

    set parent(val) {
        this._parent = val;
    }

    /**
     * このコンポーネントの状態が変わったり子供が追加された
     *
     * デフォルトの挙動は、再レンダリング
     */
    onStateChange() {
        if (this.rendered) {
            console.error("Should be re-rendered. OK?");
        }
        this.render();
    }

    addChild(childComponent) {
        this.children.push(childComponent);
        childComponent.parent = this;
        // this.onStateChange();
    }

    removeChild(childComponent) {
        let childIndex = this.children.indexOf(childComponent);
        if (childIndex >= 0) {
            this.children[childIndex].element.remove();
            this.children.splice(childIndex, 1);
        } else {

            throw "Child not found";
        }
        // this.onStateChange();
    }

    get runtime() {
        return this.element.runtimeValue();
    }

    build() {
        throw "Implement build() method";
    }

    buildSource() {
        console.log("Build " + this.constructor.name);

        // Traverse children (DFS)
        // build()  // this element
        //   build() // child 1
        //   build() // child 2
        //     build() // child 2-1
        const viewSource = this.build();
        if (viewSource) {
            viewSource.props.id = this.id;
            if (this.layout) {
                const originalLayout = viewSource.layout;
                const additionalLayout = this.layout;
                viewSource.layout = (make, view) => {
                    originalLayout(make, view);
                    additionalLayout(make, view);
                }
            }

            // Limit to children whose viewSource is not null
            if (!viewSource.views) {
                viewSource.views = [];
            }
            viewSource.views = viewSource.views.concat(this.children
                .map(child => child.buildSource())
                .filter(view => view));
        }
        return viewSource;
    }

    /**
     * 自身より下の Component をレンダリングする
     *
     * 既にレンダリングされていた場合は、再レンダリング
     */
    render() {
        const viewSource = this.buildSource();

        if (this._parent) {
            // **** Non-root element ****
            // 既にレンダリングされていたら、一旦、削除する
            if (this.element) {
                this.element.remove();
            }

            // console.log("$$$$$$$$$$$$$$$$$$$$$");
            console.log(viewSource);
            // console.log("XXXXXXXXXXXXXXXXXXXXXXXXXX");
            // console.log($(this._parent.id));

            $(this._parent.id).add(viewSource);
        } else {
            // **** Non-root element ****
            // Root element
            console.log("Root element. call $ui.render(): " + viewSource.type);
            $ui.render(viewSource);
        }
    }
}

exports.Component = Component;
