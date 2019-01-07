const {userAgent, style} = require('./scripts/constants');
const {userScript} = require('./scripts/user-script');
const {evalScript, generateKeyCommands} = require("./scripts/key-remap");
const {baseEmacsKeymap, overleafKeyMap, scrapboxKeyMap, hackmdKeyMap} = require("./scripts/keymap");

const urlOverLeaf = "https://www.overleaf.com";
const urlScrapbox = "https://scrapbox.io/";
const urlHackMD = "https://hackmd.io/";

const url = (() => {
    return urlScrapbox;
    let queryUrl = $context.query.url;
    if (queryUrl) {
        if (queryUrl === "overleaf") {
            queryUrl = urlOverLeaf;
        }
        if (queryUrl === "scrapbox") {
            queryUrl = urlScrapbox;
        }
        if (queryUrl === "hackmd") {
            queryUrl = urlHackMD;
        }
        return queryUrl;
    }
    try {
        return $file.read('last-url.txt').string.trim();
    } catch (x) {
        return urlOverLeaf;
    }
})();

// Decide keymap to use
let keymap = Object.assign({}, baseEmacsKeymap);
if (url.startsWith(urlOverLeaf)) {
    keymap = Object.assign(keymap, overleafKeyMap);
}
if (url.startsWith(urlScrapbox)) {
    keymap = Object.assign(keymap, scrapboxKeyMap);
}
if (url.startsWith(urlHackMD)) {
    keymap = Object.assign(keymap, hackmdKeyMap);
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
                url: url,
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
        }
    ]
});

function saveLastUrl(url) {
    $file.write({
        data: $data({string: url}),
        path: 'last-url.txt'
    });
}
