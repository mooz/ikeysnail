const { overleafKeyMap, scrapboxKeyMap, hackmdKeyMap } = require("./keymap");
const { userAgentMac, userAgentOriginal } = require("./constants");

function createSite(url, keymap, alias, style = "", ua = userAgentOriginal) {
  if (style) {
    // user style containing newlines are not effective
    style = style.replace(/[\r\n]+/g, " ");
  }
  return [url, keymap, alias, style, ua];
}

let sites = [];

sites.push(
  createSite(
    "https://www.overleaf.com/project/",
    overleafKeyMap,
    "overleaf",
    `
.toolbar { font-size: small !important; }
.entity { font-size: small !important; }
`
  )
);

sites.push(
  createSite(
    "https://scrapbox.io/",
    scrapboxKeyMap,
    "scrapbox",
    `
#editor {
  caret-color: transparent !important;
}`, userAgentMac
  )
);

sites.push(
  createSite(
    "https://hackmd.io/",
    hackmdKeyMap,
    "hackmd",
    `
.CodeMirror {
  caret-color: transparent !important;
}
`
  )
);

module.exports.sites = sites;
