const { sites } = require("./scripts/settings");
const {
  evalScript,
  dispatchKeys,
  generateKeyCommands
} = require("./scripts/system-remap");
const { systemKeymap } = require("./scripts/system-keymap");

function readMinified(prefix) {
  if ($file.exists(prefix + ".min.js")) {
    return $file.read(prefix + ".min.js").string;
  } else {
    return $file.read(prefix + ".js").string;
  }
}

// Decide URL to Visit
const url = (() => {
  let queryUrl = $context.query.url;
  for (let { alias } of sites) {
    if (alias === queryUrl) {
      return siteURL;
    }
  }
  if (queryUrl) {
    return queryUrl;
  }
  try {
    return $file.read("last-url.txt").string.trim();
  } catch (x) {
    return sites[0].url;
  }
})();

async function showMenu() {
  let targetSites = sites;
  let clipboardText = $clipboard.text;
  if (clipboardText && /^https?:\/\//.test(clipboardText)) {
    targetSites = targetSites.concat([[clipboardText, null, "📋"]]);
  }
  const chosen = await $ui.menu({
    items: targetSites.map(site => site.alias + " (" + site.url + ")")
  });
  if (!chosen) return;
  const url = targetSites[chosen.index].url;
  saveLastUrl(url);
  evalScript(`location.href = '${url}';`);
}

// Session to start
function startSession(urlToVisit) {
  const { userAgentMac } = require("./scripts/constants");
  let ua = userAgentMac;

  let userSettings = readMinified("./scripts/settings");
  let contentScript = readMinified("./scripts/content-script");
  contentScript = contentScript.replace(
    "/*@preserve SETTINGS_HERE*/",
    "\n" + userSettings + "\n"
  );

  let scriptToExec = contentScript;

  // Render UI
  $ui.render({
    events: {
      appeared: () => {
        $("webView")
          .runtimeValue()
          .$setAllowsBackForwardNavigationGestures(true);
      }
    },
    views: [
      {
        type: "web",
        props: {
          id: "webView",
          url: urlToVisit,
          ua: ua,
          keyCommands: generateKeyCommands(systemKeymap),
          script: scriptToExec
        },
        events: {
          log: ({ message }) => {
            // console.log(message);
          },
          didFinish: sender => {
            saveLastUrl(sender.url);
          },
          urlDidChange: sender => {
            saveLastUrl(sender.url);
          },
          doubleTapped: async () => {
            evalScript(`jsbox.doubleClick();`);
          },
          paste: async () => {
            evalScript(`jsbox.insertText('${escape($clipboard.text)}', true)`);
          },
          killLine: async () => {
            await dispatchKeys("shift-end", true, true);
            const selectedText = await evalScript(
              `jsbox.getSelectedText()`,
              true
            );
            await dispatchKeys("back_space", true);
            $clipboard.set({ type: "public.plain-text", value: selectedText });
          },
          killRegion: async () => {
            const selectedText = await evalScript(
              `jsbox.getSelectedText()`,
              true
            );
            await dispatchKeys("back_space", true);
            $clipboard.set({ type: "public.plain-text", value: selectedText });
          },
          copyRegion: async () => {
            const selectedText = await evalScript(
              `jsbox.getSelectedText()`,
              true
            );
            $clipboard.set({ type: "public.plain-text", value: selectedText });
          }
        },
        layout: $layout.fill
      },
      {
        type: "button",
        props: {
          icon: $icon("067", $rgba(100, 100, 100, 0.65), $size(20, 20)),
          bgcolor: $color("clear")
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
  if (!url || url === "about:blank") {
    return;
  }
  $file.write({
    data: $data({ string: url }),
    path: "last-url.txt"
  });
}

startSession(url);
