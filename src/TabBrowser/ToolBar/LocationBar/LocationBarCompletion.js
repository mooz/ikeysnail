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
        this._locationBar = null;
        this._canceled = false;
        // TODO: 最終的にはピクセル計算やめたいので、この変数は消したい
        this.TOPBAR_HEIGHT = TOPBAR_HEIGHT;
        this.CANDIDATE_HEIGHT = CANDIDATE_HEIGHT;

        this.defineState({
            suggestionList: null,
            suggestionIndex: -1
        });
    }

    set locationBar(val) {
        this._locationBar = val;
    }

    get suggestionIndex() {
        return this.state.suggestionIndex;
    }

    get suggestionSelected() {
        return this.state.suggestionIndex >= 0;
    }

    set suggestions(val) {
        this.setSuggestions(val);
    }

    setSuggestions(suggestionList, index=-1) {
        if (suggestionList && index >= 0) {
          index = Math.min(index, suggestionList.length - 1);
        }
        this.setState({
            suggestionList: suggestionList,
            suggestionIndex: index
        })
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
            index = this.state.suggestionIndex;
        }
        if (index >= 0) {
            let cand = this.state.suggestionList[index];
            cand.constructor.execAction(cand, this._browser);
        }
    }

    selectNextCandidate() {
        if (this.state.suggestionIndex < 0) {
            this.setState({suggestionIndex: 0});
        } else {
            this.setState({
                suggestionIndex: (this.state.suggestionIndex + 1) % this.state.suggestionList.length
            });
        }
    }

    selectPreviousCandidate() {
        let index = -1;
        if (this.state.suggestionIndex < 0) {
            index = this.state.suggestionList.length - 1;
        } else {
            if (this.state.suggestionIndex - 1 < 0) {
                index = this.state.suggestionList.length - 1;
            } else {
                index = this.state.suggestionIndex - 1;
            }
        }
        this.setState({suggestionIndex: index});
    }

    build() {
        const candidates = this.state.suggestionList;
        const selectedIndex = this.state.suggestionIndex;

        // if (!candidates || !candidates.length) {
        //     return null;
        // }

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

        let hidden = (candidates || []).length === 0;

        return {
            type: "list",
            events: {
                didSelect: (sender, indexPath) => {
                    this.decide(indexPath.row);
                }
            },
            props: {
                id: "completion-list",
                rowHeight: this.CANDIDATE_HEIGHT,
                template: template,
                data: data,
                bgColor: COLOR_CANDIDATE_BG,
                borderWidth: 1,
                radius: 5,
                borderColor: COLOR_CANDIDATE_BORDER,
                hidden: hidden
            },
            layout: (make, view) => {
                let locationBar = this._locationBar.element;
                make.centerX.equalTo(locationBar.centerX);
                make.width.equalTo(locationBar).priority(1);
                make.height.equalTo(this.CANDIDATE_HEIGHT * (candidates || []).length).priority(1);
                // このコードだと、最初に候補が出たときかならず表示がバグる （ スクリーン上部にはりつく)
                // make.top.equalTo(locationBar.bottom).priority(1);
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
        browser.visitURL(suggestion.url);
        browser.blurLocationBar();
    }

    get iconType() {
        return "star.fill";
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
        const urls = browser._tabs.map(tab => tab.url);
        const titles = browser._tabs.map(tab => tab.title);
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

const SUGGESTION_GOOGLE = "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=";

class SuggestionWebQuery extends Suggestion {
    constructor(query, name) {
        super(query, "Suggested by " + name);
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

    static generateByQuery(query, browser, endPoint = SUGGESTION_GOOGLE) {
        const completionURL = SUGGESTION_GOOGLE + encodeURIComponent(query);
        return new Promise((resolve, reject) => {
            $http.request({
                method: "GET",
                url: completionURL,
                handler: function (resp) {
                    if (resp.error) {
                        reject(resp.error);
                    } else {
                        resolve(resp.data[1].map(title => new SuggestionWebQuery(title, "Google")));
                    }
                }
            });
        });
    }
}

class SuggestionScrapbox extends Suggestion {
    constructor(query, url) {
        super(query, url);
    }

    get iconType() {
        return "dollarsign.square";
    }

    static generateByQuery(query, browser) {
        const userName = browser.config.SCRAPBOX_USER;
        const completionURL =
            `https://scrapbox.io/api/pages/${userName}/search/query?skip=0&sort=updated&limit=30&q=` +
            encodeURIComponent(query);
        return new Promise((resolve, reject) => {
            if (!userName) {
                return resolve(null);
            }
            */

            $http.request({
                method: "GET",
                url: completionURL,
                handler: function (resp) {
                    if (resp.error || resp.data.statusCode === 401) {
                        resolve(null);
                    } else {
                        resolve(resp.data.pages.map(p => new SuggestionScrapbox(
                            p.title,
                            `https://scrapbox.io/${userName}/${encodeURIComponent(p.title)}`
                        )));
                    }
                }
            });
        });
    }
}

exports.LocationBarCompletion = LocationBarCompletion;
exports.Suggestion = Suggestion;
exports.SuggestionTab = SuggestionTab;
exports.SuggestionBookmark = SuggestionBookmark;
exports.SuggestionWebQuery = SuggestionWebQuery;
exports.SuggestionHistory = SuggestionHistory;
exports.SuggestionScrapbox = SuggestionScrapbox;