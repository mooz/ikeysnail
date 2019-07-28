# iKeySnail

iKeySnail provides fully-configurable hardware keyboard functionalities for web browsing on iOS (iPadOS). It provides,

- Fully-configurable hardware keyboard web browsing functionalities
    - Tested on Smart Keyboard Folio and Magic Keyboard, but is not limited to.
- Link-hints (hit-a-hint) for clicking links without touching your iOS device screen
    - 
- Pre-configured Emacs-like keybindings/functionalities
    - e.g., `Ctrl-Space` to set mark, `Meta-w` to copy the selected region, `Ctrl-y` to yank (paste) the clipboard text
- Vim-like keybindings
    - e.g., `j/k/h/l/g/G` to quickly scroll web pages
- Vertical tabs
    - Tab orientations can be customizable
- Omnibar support
    - 

The aim of this project is to provide { Vimium, Vimperator, Surfingkeys, KeySnail } for iOS.

## Installation

You need JSBox (https://docs.xteko.com/#/en/) to run iKeySnail. After installing the JSBox, access either of 
- <https://tinyurl.com/install-ikeysnail>
- [jsbox://import/?url=https%3A%2F%2Fgithub.com%2Fmooz%2Fikeysnail%2Farchive%2Fmaster.zip](jsbox://run?name=ikeysnail)

from iOS Safari. Then JSBox will install iKeySnail.

You can also manually download the repository as a `zip` file and install it in JSBox.

## Usage

See `strings/settings.js` for available shortcuts. Default keybindings are follows.

| Command | Description |
| --- | --- |
| git status | List all new or modified files |
| git diff | Show file differences that haven't been staged |

## Customization

Edit `strings/settings.js` for customization.

### Keymap

We have four types of `mode` for key bindings.

1. `all`-mode, whose keymaps are always active.
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L19>
2. `view`-mode, whose keymaps are active only if the cursor isn't on editable elements (akin to vim's `normal` mode).
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L81>
3. `rich`-mode, whose keymaps are active only if the cursor is on rich text editors (such as CodeMirror, Ace, Scrapbox, and `contenteditable`).
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L32>
4. `edit`-mode, whose keymaps are active only if the cursor is on `input` or `textarea`.
    - <https://github.com/mooz/jsbox-ksc/blob/master/strings/settings.js#L74>

## Acknowledgements

Parts of iKeySnail are inspired by previous wonderful works (thanks to).

- Scrapbox scripts by @four_or_three
  - <https://scrapbox.io/customize/iPad%E3%81%A8%E5%A4%96%E9%83%A8%E3%82%AD%E3%83%BC%E3%83%9C%E3%83%BC%E3%83%89%E3%81%A7%E7%B7%A8%E9%9B%86%E3%81%A7%E3%81%8D%E3%82%8BScrapbox%E3%81%AE%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6>
- Bookmarklet Hit-a-hint @okayu_tar_gz
  - <https://qiita.com/okayu_tar_gz/items/924481d4acf50be37618>

## Misc

KSC stands for KeySnail for Cocoa.
