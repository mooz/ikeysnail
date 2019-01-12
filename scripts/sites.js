const {overleafKeyMap, scrapboxKeyMap, hackmdKeyMap} = require("./keymap");

function createSite(url, keymap, alias, style="") {
    if (style) {
        // user style containing newlines are not effective
        style = style.replace(/[\r\n]+/g, " ");
    }
    return [url, keymap, alias, style]
}

let sites = [];

sites.push(createSite("https://www.overleaf.com/", overleafKeyMap, "overleaf"));
sites.push(createSite("https://scrapbox.io/", scrapboxKeyMap, "scrapbox", `
#editor {
  caret-color: transparent !important;
}`));

sites.push(createSite("https://hackmd.io/", hackmdKeyMap, "hackmd", `
.CodeMirror {
  caret-color: transparent !important;
}
`));

module.exports.sites = sites;
