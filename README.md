# KSC

Edit your manuscripts on iOS with Emacs-like keybindings!

KSC is a JSBox script for providing keyconfig experience on web-based rich text editors in iOS.

## Installation

You need JSBox (https://docs.xteko.com/#/en/) to run KSC.

After installing the JSBox, access

<https://tinyurl.com/install-ksc>

or

[jsbox://import/?url=https%3A%2F%2Fgithub.com%2Fmooz%2Fjsbox-ksc%2Farchive%2Fmaster.zip](jsbox://run?name=jsbox-ksc-master&url=overleaf)

from the Safari of your iOS device to install the KSC script.

## Usage

Specify pre-configured website names (overleaf, scrapbox, hackmd)

- Overleaf: [jsbox://run?name=jsbox-ksc-master&url=overleaf](jsbox://run?name=jsbox-ksc-master&url=overleaf)
  - Overleaf v1 support is imperfect
- Scrapbox: [jsbox://run?name=jsbox-ksc-master&url=scrapbox](jsbox://run?name=jsbox-ksc-master&url=overleaf)
- HackMD: [jsbox://run?name=jsbox-ksc-master&url=hackmd](jsbox://run?name=jsbox-ksc-master&url=overleaf)

or provide a website URL (encoded)

- [jsbox://run?name=jsbox-ksc-master&url=https%3A%2F%2Fscrapbox.io%2Fsome%2Fpage](jsbox://run?name=jsbox-ksc-master&url=overleaf)

## Customization

Edit `scripts/keymap.js` for customizing key bindings.

## Acknowledgements

Heavily based on the following script (thanks to @four_or_three).

<https://scrapbox.io/customize/iPad%E3%81%A8%E5%A4%96%E9%83%A8%E3%82%AD%E3%83%BC%E3%83%9C%E3%83%BC%E3%83%89%E3%81%A7%E7%B7%A8%E9%9B%86%E3%81%A7%E3%81%8D%E3%82%8BScrapbox%E3%81%AE%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6>

## Misc

KSC stands for KeySnail for Cocoa.
