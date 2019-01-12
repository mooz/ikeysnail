const {userAgent} = require('./scripts/constants');
const {userScript} = require('./scripts/user-script');
const {evalScript, generateKeyCommands} = require("./scripts/key-remap");
const {baseEmacsKeymap} = require("./scripts/keymap");
const {sites} = require('./scripts/sites');

// Decide URL to Visit
const url = (() => {
    let queryUrl = $context.query.url;
    for (let [siteURL, siteKeymap, siteAlias, siteStyle] of sites) {
        if (siteAlias === queryUrl) {
            return siteURL;
        }
    }
    if (queryUrl) {
        return queryUrl;
    }
    try {
        return $file.read('last-url.txt').string.trim();
    } catch (x) {
        return sites[0][0];
    }
})();

async function showMenu() {
    const chosen = await $ui.menu({items: sites.map(site => site[2] + " (" + site[0] + ")")});
    if (!chosen) return;
    const url = sites[chosen.index][0];
    startSession(url);
}

// Session to start
function startSession(urlToVisit) {
    let keymap = Object.assign({}, baseEmacsKeymap);
    let style = "";

    for (let [siteURL, siteKeyMap, siteAlias, siteStyle] of sites) {
        if (urlToVisit.startsWith(siteURL)) {
            siteKeyMap = Object.assign(keymap, siteKeyMap);
            gstyle += " " + siteStyle;
        }
    }

    // Render UI
    $ui.render({
        props: {
            keyCommands: generateKeyCommands(keymap)
        },
        events: {
            appeared: () => {
                $('webView').runtimeValue().$setAllowsBackForwardNavigationGestures(true);
            }
        },
        views: [
            {
                type: 'web',
                props: {
                    id: 'webView',
                    url: urlToVisit,
                    ua: userAgent,
                    script: userScript,
                    style: style
                },
                events: {
                    log: ({message}) => {
                        // console.log(message);
                    },
                    didFinish: () => {
                        saveLastUrl($('webView').url);
                    },
                    urlDidChange: sender => {
                        console.log(sender.url)
                        saveLastUrl(sender.url);
                    },
                    doubleTapped: async () => {
                        evalScript(`jsbox.doubleClick();`);
                    }
                },
                layout: $layout.fill
            },
            {
                type: 'button',
                props: {
                    icon: $icon('067', $rgba(100, 100, 100, 0.65), $size(20, 20)),
                    bgcolor: $color('clear')
                },
                events: {
                    tapped: () => {
                        showMenu();
                    }
                },
                layout: make => {
                    make.bottom.inset(80);
                    make.right.inset(5);
                }
            }
        ]
    });
}

function saveLastUrl(url) {
    $file.write({
        data: $data({string: url}),
        path: 'last-url.txt'
    });
}

startSession(url);
