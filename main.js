const {userAgent, style} = require('./scripts/constants');
const {userScript} = require('./scripts/user-script');
const {evalScript, generateKeyCommands} = require("./scripts/key-remap");
const {baseEmacsKeymap, overleafKeyMap, scrapboxKeyMap} = require("./scripts/keymap");

/*
 [URL Scheme]

 Specify website (overleaf / scrapbox)

 jsbox://run?name=KSC&url=overleaf
 jsbox://run?name=KSC&url=scrapbox
 jsbox://run?name=KSC&url=hackmd

 or provides encoded URL (arbitrary website)

 jsbox://run?name=KSC&url=https%3A%2F%2Fscrapbox.io%2Fsome%2Fpage
*/

const urlOverLeaf = "https://www.overleaf.com";
const urlScrapbox = "https://scrapbox.io/";
const urlHackMD = "https://hackmd.io/";
const url = (() => {
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
    return $file.read('last-url.txt').string.trim();
})();

// Decide keymap to use
let keymap = Object.assign({}, baseEmacsKeymap);
if (url.startsWith(urlOverLeaf)) {
    keymap = Object.assign(keymap, overleafKeyMap);
}
if (url.startsWith(urlScrapbox)) {
    keymap = Object.assign(keymap, scrapboxKeyMap);
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
