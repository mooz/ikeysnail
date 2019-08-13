const {Component} = require("../../../Component");
const {LocationBarCompletion} = require("./LocationBarCompletion");

// URL Bar
const COLOR_URL_FG = "#2B9E46";

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

class LocationBar extends Component {
    constructor(browser, completion,
        WIDTH_RATIO = 0.5,
        HEIGHT_RATIO = 0.65) {
            super();
            this._browser = browser;
            this._completion = completion;
            this.WIDTH_RATIO = WIDTH_RATIO;
            this.HEIGHT_RATIO = HEIGHT_RATIO;
        }

        get suggestionSources() {
            if (this._currentSuggestionSources) {
                return this._currentSuggestionSources;
            }
            return this._browser.config.LOCATIONBAR_SUGGESTIONS;
        }

        set suggestionSources(val) {
            this._currentSuggestionSources = val;
            // TODO: Change this appropriately!
            this.suggestionInfoElement.text = val[0].toString().slice(4);
        }

        finishSuggestionSession() {
            this._currentSuggestionSources = null;
        }

        // startSession(sources) {
        //     this.suggestionSources = sources;
        //     this.focus();
        // }

        focus(sources) {
            this.suggestionSources = sources || null;
            this.element.focus();
            this.runtime.$selectAll();
            this._completion.reset();
        }
        
        blur() {
            this.finishSuggestionSession();
            this.element.blur();
            this._browser.focusContent();
        }
        
        setURLText(url) {
            this.element.text = decodeURIComponent(url);
        }

        get suggestionInfoElement() {
            // TODO: Use relative path
            return $("location-bar-hint");
        }
        
        build() {
            const isURL = urlLike => /https?:\/\//.test(urlLike);
            let browser = this._browser;
            let originalURL = null;

            let latestQuery = null;
            const obtainSuggestions = async (query, sender) => {
                latestQuery = query;
                if (query.length < 1) {
                    this._completion.suggestions = null;
                    return;
                }
                if (this._completion.canceled) {
                    return;
                }
                const NUM_CANDIDATE_MAX = 5;
                const suggestionTasks = this.suggestionSources.map(suggestionClass => {
                    if (typeof suggestionClass === "string") {
                        const CompletionModule = require("./LocationBarCompletion");
                        suggestionClass = CompletionModule[suggestionClass];
                    }
                    return suggestionClass.generateByQuery(query, browser);
                });
                
                const waitAll = this._browser.config.LOCATIONBAR_SUGGESTIONS_SYNCED;
                if (waitAll) {
                    let suggestions = await Promise.all(suggestionTasks);
                    suggestions = suggestions
                    .filter(s => !!s)
                    .map(eachSuggestions => eachSuggestions.slice(0, NUM_CANDIDATE_MAX))
                    .flat();
                    if (this._completion.canceled) {
                        return;
                    }
                    this._completion.suggestions = suggestions;
                } else {
                    // (TODO) reorder candidates according to sources -> Not needed for usability.
                    let allSuggestions = [];                    
                    suggestionTasks.forEach(task => {
                        task.then(completedSuggestions => {
                            if (latestQuery !== query) {
                                return;
                            }
                            if (completedSuggestions) {
                                allSuggestions = allSuggestions.concat(completedSuggestions.slice(0, NUM_CANDIDATE_MAX));
                            }
                            if (this._completion.canceled) {
                                return;
                            }           
                            this._completion.setSuggestions(
                                allSuggestions,
                                this._completion.suggestionSelected ? this._completion.suggestionIndex : -1
                            );
                        });
                    });
                }
            };
            const obtainSuggestionsDebounce = debounce(obtainSuggestions, 150);

            const locationBar = {
                type: "input",
                props: {
                    id: this.id,
                    textColor: $color(COLOR_URL_FG),
                    align: $align.center
                },
                layout: (make, view) => {
                    make.centerY.equalTo(view.super.center);
                    make.height.equalTo(view.super.height);
                    make.width.equalTo(view.super.width);
                    // TODO: Okay?

                    make.left.equalTo(view.left.right).offset(5);
                    // make.centerX.equalTo(view.super.center);
                },
                events: {
                    didBeginEditing: sender => {
                        sender.align = $align.left;
                        sender.textColor = $rgba(0, 0, 0, 1);
                        originalURL = sender.text;
                    },
                    tapped: sender => {
                        this.focus();
                    },
                    returned: sender => {
                        this.decideCandidate();
                    },
                    didEndEditing: sender => {
                        this._completion.cancel();
                        sender.align = $align.center;
                        sender.textColor = $color(COLOR_URL_FG);
                        sender.text = originalURL;
                    },
                    changed: sender => {
                        if (isURL(sender.text)) {
                            return;
                        }
                        obtainSuggestionsDebounce(sender.text, sender);
                    }
                }
            };

            const locationBarHint = {
                type: "label",
                props: {
                    id: "location-bar-hint",
                    text: " Google ",
                    bgcolor: $color("#b1d0ff"),
                    textColor: $color("#1625ff"),
                    borderColor: $color("#1625ff"),
                    borderWidth: 1,
                    radius: 5,
                    align: $align.center,
                },
                layout: (make, view) => {
                    make.centerY.equalTo(view.super.center);
                    make.left.equalTo(view.super.left).offset(10);
                },
            };

            return {
                type: "view",
                props: {},
                layout: (make, view) => {
                    make.centerY.equalTo(view.super.center);
                    make.height.equalTo(view.super.height).multipliedBy(this.HEIGHT_RATIO);
                    make.width.equalTo(view.super.width).multipliedBy(this.WIDTH_RATIO);
                    make.centerX.equalTo(view.super.center).priority(100);
                },
                views: [
                    locationBar,
                    locationBarHint
                ]
            };
        };
        
        decideCandidate() {
            if (this._completion.suggestionSelected) {
                this._completion.decide();
            } else {
                this._browser.visitURL(this.element.text);
                this._browser.focusContent();
            }
        }
        
        selectNextCandidate() {
            this._completion.selectNextCandidate();
        }
        
        selectPreviousCandidate() {
            this._completion.selectPreviousCandidate();
        }
    }
    
    
    exports.LocationBar = LocationBar;
    