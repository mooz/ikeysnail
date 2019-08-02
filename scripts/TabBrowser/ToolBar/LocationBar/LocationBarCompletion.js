const {Component} = require("../../../Component");


const COLOR_CANDIDATE_BORDER = $color("#c6c6c6");
const COLOR_CANDIDATE_BG = $color("#bbbbbb");
const COLOR_CANDIDATE_BG_SELECTED = $color("#DDDDDD");

// TODO: Add bookmark search (sites).

class LocationBarCompletion extends Component {
    constructor(browser,
                TOPBAR_HEIGHT,
                CANDIDATE_HEIGHT = 40) {
        super();
        this._browser = browser;
        this._suggestionList = null;
        this._suggestionIndex = -1;
        this._locationBar = null;
        this._canceled = false;
        // TODO: 最終的にはピクセル計算やめたいので、この変数は消したい
        this.TOPBAR_HEIGHT = TOPBAR_HEIGHT;
        this.CANDIDATE_HEIGHT = CANDIDATE_HEIGHT;
    }

    set locationBar(val) {
        this._locationBar = val;
    }

    get suggestionSelected() {
        return this._suggestionIndex >= 0;
    }

    set suggestions(suggestionList) {
        this._suggestionList = suggestionList;
        this._suggestionIndex = -1;
        this.onStateChange();
    }

    reset() {
        this._canceled = false;
    }

    cancel() {
        this._canceled = true;
        this.suggestions = null;
    }

    get canceled() {
        return this._canceled;
    }

    decide(index) {
        if (typeof index !== "number") {
            index = this._suggestionIndex;
        }
        if (index >= 0) {
            let cand = this._suggestionList[index];
            cand.constructor.execAction(cand, this._browser);
        }
    }

    selectNextCandidate() {
        if (this._suggestionIndex < 0) {
            this._suggestionIndex = 0;
        } else {
            this._suggestionIndex =
                (this._suggestionIndex + 1) % this._suggestionList.length;
        }
        this.onStateChange();
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
        this.onStateChange();
    }

    build() {
        const candidates = this._suggestionList;
        const selectedIndex = this._suggestionIndex;

        if (!candidates) {
            return null;
        }

        const ICON_AREA_WIDTH = 32;

        const template = {
            props: {},
            views: [
                {
                    type: "view",
                    props: {
                        id: "completion-rectangle",
                        bgcolor: $color("#FFFFFF")
                    },
                    layout: $layout.fill,
                    views: [
                        {
                            type: "view",
                            layout: (make, view) => {
                                // Left
                                // $layout.fill
                                make.width.equalTo(ICON_AREA_WIDTH);
                                make.height.equalTo(view.super);
                            },
                            views: [
                                {
                                    type: "button",
                                    props: {
                                        id: "completion-icon",
                                        bgcolor: $color("clear"),
                                        align: $align.center
                                    },
                                    layout: (make, view) => {
                                        make.centerX.equalTo(view.super);
                                        make.centerY.equalTo(view.super);
                                    }
                                },
                            ]
                        },
                        {
                            type: "view",
                            layout: (make, view) => {
                                make.width.equalTo(view.super).offset(ICON_AREA_WIDTH);
                                make.height.equalTo(view.super);
                                make.left.equalTo(ICON_AREA_WIDTH);
                            },
                            views: [
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
                                        make.left.inset(3);
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
                                        make.left.inset(3);
                                        make.width.equalTo(view.super.width);
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const data = (candidates || []).map((candidate, index) => {
            let label = {
                "completion-label": {
                    text: candidate.text,
                    tabIndex: index
                },
                "completion-url": {
                    text: candidate.urlReadable
                },
                "completion-icon": {}
            };
            if (/^[0-9]+$/.test(candidate.iconType)) {
                label["completion-icon"].icon = candidate.icon;
            } else {
                label["completion-icon"].symbol = candidate.iconType;
            }

            if (index === selectedIndex) {
                label["completion-rectangle"] = {
                    bgcolor: COLOR_CANDIDATE_BG_SELECTED
                };
            }
            return label;
        });

        return {
            type: "list",
            events: {
                didSelect: (sender, indexPath) => {
                    this.decide(indexPath.row);
                }
            },
            props: {
                id: this.id,
                rowHeight: this.CANDIDATE_HEIGHT,
                template: template,
                data: data,
                bgColor: COLOR_CANDIDATE_BG,
                borderWidth: 1,
                radius: 5,
                borderColor: COLOR_CANDIDATE_BORDER
            },
            layout: (make, view) => {
                make.centerX.equalTo(view.super);
                make.width.equalTo(this._locationBar.element);
                make.height.equalTo(this.CANDIDATE_HEIGHT * candidates.length);
                // このコードだと、最初に候補が出たときかならず表示がバグる （ スクリーン上部にはりつく)
                // make.top.equalTo(this._locationBar.element.bottom);
                // なので、汚いがピクセル固定でごまかす。。
                const URLBAR_HEIGHT = this.TOPBAR_HEIGHT * this._locationBar.HEIGHT_RATIO;
                make.top.equalTo(URLBAR_HEIGHT + ((this.TOPBAR_HEIGHT - URLBAR_HEIGHT) / 2) + 1);
            }
        };
    }
}

// TODO: Make the off-the-ui-thread
// TODO: Or use sqlite!
function findPageEntriesByQuery(query,
                                urls, titles,
                                reverse = false,
                                caseInsensitive = false,
                                RESULTS_COUNT_LIMIT = 5) {
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

// ------------------------------------------------------------------------ //
// Suggestion class
// ------------------------------------------------------------------------ //

class Suggestion {
    constructor(text, url) {
        this.text = text;
        this.url = url;
    }

    get urlReadable() {
        return decodeURIComponent(this.url.replace(/^https?:\/\//, ""));
    }

    static async generateByQuery(query, browser) {
        throw "Implement";
    }

    static execAction(suggestion, browser) {
    }

    get iconType() {
        return "000";
    }

    get icon() {
        return $icon(
            this.iconType,
            $rgba(140, 140, 140, 0.8),
            $size(13, 13)
        );
    }
}

class SuggestionTab extends Suggestion {
    constructor(title, url, tabIndex) {
        super(title, url);
        this.tabIndex = tabIndex;
    }

    get iconType() {
        return "macwindow";
    }

    static execAction(suggestion, browser) {
        browser.blurLocationBar();
        browser.selectTab(suggestion.tabIndex);
    }

    static async generateByQuery(query, browser) {
        const urls = browser.tabs.map(tab => tab.url);
        const titles = browser.tabs.map(tab => tab.title);
        const result = await findPageEntriesByQuery(query, urls, titles, false, true);
        return result.map(idx => new SuggestionTab(titles[idx], urls[idx], idx));
    }
}

class SuggestionHistory extends Suggestion {
    constructor(title, url) {
        super(title, url);
    }

    get iconType() {
        return "clock";
    }

    static execAction(suggestion, browser) {
        browser.visitURL(suggestion.url);
        browser.blurLocationBar();
    }

    static async generateByQuery(query, browser) {
        const urls = browser._pastURLs;
        const titles = browser._pastTitles;
        const result = await findPageEntriesByQuery(query, urls, titles, true, true);
        return result.map(idx => new SuggestionHistory(titles[idx], urls[idx]))
    }
}

class SuggestionBookmark extends Suggestion {
    constructor(title, url) {
        super(title, url);
    }

    get iconType() {
        return "star.fill";
    }

    static execAction(suggestion, browser) {
        browser.visitURL(suggestion.url);
        browser.blurLocationBar();
    }

    static async generateByQuery(query, browser) {
        let bookmarks = browser.bookmarks;
        const result = await findPageEntriesByQuery(query,
            bookmarks.map(b => b.url),
            bookmarks.map(b => b.title), false, true);
        return result.map(
            idx => new SuggestionBookmark(bookmarks[idx].title, bookmarks[idx].url)
        )
    }
}

class SuggestionWebQuery extends Suggestion {
    constructor(query) {
        super(query, "suggested by Google");
    }

    get urlReadable() {
        return this.url;
    }

    get iconType() {
        return "magnifyingglass";
    }

    static execAction(suggestion, browser) {
        browser.visitURL(suggestion.text);
        browser.blurLocationBar();
    }

    static generateByQuery(query, browser) {
        const completionURL =
            "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=" +
            encodeURIComponent(query);
        return new Promise((resolve, reject) => {
            $http.request({
                method: "GET",
                url: completionURL,
                handler: function (resp) {
                    if (resp.error) {
                        reject(resp.error);
                    } else {
                        resolve(resp.data[1].map(title => new SuggestionWebQuery(title)));
                    }
                }
            });
        });
    }
}

exports.LocationBarCompletion = LocationBarCompletion;
exports.SuggestionTab = SuggestionTab;
exports.SuggestionBookmark = SuggestionBookmark;
exports.SuggestionWebQuery = SuggestionWebQuery;
exports.SuggestionHistory = SuggestionHistory;