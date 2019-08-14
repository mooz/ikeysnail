# iKeySnail

iKeySnail provides fully-configurable hardware keyboard functionalities for web browsing on iOS (iPadOS). 

The aim of this project is to provide { Vimium, Vimperator, Surfingkeys, KeySnail } for iOS. Currently, **iKeySnail** supports

- **Hardware keyboard supported web browsing**
    - **Emacs-like keybindings/functionalities**
      - e.g., `Ctrl-Space` to set mark, `Meta-w` to copy the selected region, `Ctrl-y` to yank (paste) the clipboard text
    - **Vim-like keybindings/functionalities**
      - e.g., `j/k/h/l/g/G` to quickly scroll web pages
- **Link-hints (Hit-a-hint)**
    - For clicking links without touching your iOS device screen
    - ![hints](https://gyazo.com/e29a8499426094c5502882996549df49.png)
- **Vertical tabs**
    - We do support vertical tabs in iOS!
    - Setting `config.TAB_VERTICAL = true` makes tab orientations vertical
    - ![vtabs](https://i.gyazo.com/709ea2e6826261fc9f190f5c40d83b4d.png)
- **Omnibar support**
    - Work-in-progress, but we do support omnibar. By default, pressing `o` opens your bookmarks.
    - ![omnibar](https://i.gyazo.com/fd8c924afcf242a85598bc4123070f53.png)

## Installation

You need JSBox (https://docs.xteko.com/#/en/) to run iKeySnail. After installing the JSBox, access either of 
- <https://tinyurl.com/ikeysnail>
- jsbox://import/?url=https%3A%2F%2Fgithub.com%2Fmooz%2Fikeysnail%2Freleases%2Flatest%2Fdownload%2Fikeysnail.box

from iOS Safari. Then JSBox will install iKeySnail.

You can also manually download the repository as a `zip` file and install it in JSBox.

## Usage

See `strings/settings.js` for available shortcuts.

## Customization

Edit `strings/settings.js`.

### Defining / Customizing Keymap

We have four types of `mode` for key bindings.

1. `all`-mode, whose keymaps are always active.
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L19>
2. `view`-mode, whose keymaps are active only if the cursor isn't on editable elements (akin to vim's `normal` mode).
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L81>
3. `rich`-mode, whose keymaps are active only if the cursor is on rich text editors (such as CodeMirror, Ace, Scrapbox, and `contenteditable`).
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L32>
4. `edit`-mode, whose keymaps are active only if the cursor is on `input` or `textarea`.
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L74>

In each keymap, you can define a key's functionality in two ways:
1. Remapping to different key (e.g., `"ctrl-s": "meta-f"`), and
2. Invoke a JavaScript function (e.g., `"ctrl-y": () => keysnail.paste()`).
    - See `keysnail` object for checking available functionalities <https://github.com/mooz/jsbox-ksc/blob/master/strings/content-script.js#L761>

### Defining a site

You can also define a site configuration in your `settings.js`. Configuration consists of
- `keymap` -> keymap
- `style` -> user css
- `alias` -> alias
- `url` -> url.

Examples are follows.

```javascript
config.sites.push({
    alias: "Google",
    url: "https://www.google.com"
  });

  const GDOCS_KEYMAP = {
    rich: {
      "meta-f": keysnail.marked("alt-ArrowRight"),
      "meta-b": keysnail.marked("alt-ArrowLeft"),
      "meta-d": keysnail.marked("alt-Delete"),
      "ctrl-_": "ctrl-z",
      "ctrl-z": "meta-z",
      "ctrl-s": "ctrl-f"
    }
  };

  config.sites.push({
    alias: "Google Docs",
    url: "https://docs.google.com/",
    keymap: GDOCS_KEYMAP
  });

  config.sites.push({
    alias: "Google Docs (Slide)",
    url: "https://docs.google.com/presentation/",
    keymap: GDOCS_KEYMAP
  });

  config.sites.push({
    alias: "OverLeaf",
    url: "https://www.overleaf.com/project/",
    style: `
.toolbar { font-size: small !important; }
.entity { font-size: small !important; }
`
  });

  config.sites.push({
    alias: "Scrapbox",
    url: "https://scrapbox.io/",
    keymap: {
      rich: {
        "meta-f": keysnail.marked("alt-ArrowRight"),
        "meta-b": keysnail.marked("alt-ArrowLeft"),
        "ctrl-i": "ctrl-i",
        "ctrl-t": "ctrl-t"
      }
    },
    style: `
#editor {
  caret-color: transparent !important;
}
`
  });
```

## Gifs

### Omnibar

![omnibar-mov](https://i.gyazo.com/cd5257f363c6b496b0b576523b771782.gif)

### Link hints

![linkhints-mov](https://i.gyazo.com/18bc245a55f29876c4937a0884d8bf8d.gif)

## Acknowledgements

Parts of iKeySnail are inspired by previous wonderful works (thanks to).

- Scrapbox scripts by @four_or_three
  - <https://scrapbox.io/customize/iPad%E3%81%A8%E5%A4%96%E9%83%A8%E3%82%AD%E3%83%BC%E3%83%9C%E3%83%BC%E3%83%89%E3%81%A7%E7%B7%A8%E9%9B%86%E3%81%A7%E3%81%8D%E3%82%8BScrapbox%E3%81%AE%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6>
- Bookmarklet Hit-a-hint @okayu_tar_gz
  - <https://qiita.com/okayu_tar_gz/items/924481d4acf50be37618>
