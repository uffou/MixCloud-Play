# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Unreleased

### Added

- CHANGELOG.md file

### Changed

- Update dependency `electron` from v26.2.4 to **v29.1.1**
- Update dependency `electron-builder` from v24.6.4 to **v24.13.3**
- Update dependency `electron-updater` from v6.1.4 to **v6.1.8**
- Update dependency `electron-store` from v8.1.0 to **v8.2.0**

## 0.20.0 - 📦 Package Dependency Updates

### Changed

It's 11 months since the last update...

- Reduced the drag area in the header so that the Nav links and buttons are clickable
- Update dependency `electron` from v21.2.0 to **v26.2.4**
- Update dependency `electron-builder` from v23.6.0 to **v24.6.4**
- Update dependency `electron-updater` from v5.3.0 to **v61.4**
- Update dependency `electron-context-menu` from v3.6.0 to **v3.6.1**

Release Track: 🎵 <https://www.mixcloud.com/lowlight/electronic-music-1971/>

## 0.19.0 - 🎃 Less Surprises Release

### Changed

A **big** re-write of how track info is collected and track changes are checked which allows the Menu Tray and Notifications to better stay in sync - _so you can see what you hear_ -  less surprises! 🎃

But one _surprising_ change 🧙 is that now when you attempt to quit or close the window while the audio is playing... the app will close! Why is that a suprise? Well in the past it didn't do this [mountainash/Mixcloud-Play#89](https://github.com/mountainash/Mixcloud-Play/issues/89)

## :package: Dependency Updates :arrow_up:

- Update dependency `electron` from v21.0.1 to **v21.2.0**
- Update dependency `electron-builder` from v23.3.3 to **v23.6.0**
- Update dependency `electron-updater` from v5.2.1 to **v5.3.0**
- Update dependency `electron-context-menu` from v3.5.0 to **v3.6.0**

Release Track: 🎵 <https://www.mixcloud.com/johnnykage19/halloween-set-siriusxm-ch13-pitbulls-globalization/>

## 0.18.6 - Electron v21 & other Dependency updates

### Changed

Dependency updates

- Update dependency `electron` from v17.1.0 to **v21.0.1**
- Update dependency `electron-builder` from v22.14.13 to **v23.3.3**
- Update dependency `electron-updater` from v4.6.5 to **v5.2.1**
- Update dependency `electron-context-menu` from v3.1.2 to **v3.5.0**
- Update dependency `electron-store` from v8.0.1 to **v8.1.0**

Release Track: 🎵 <https://www.mixcloud.com/Dependencies/u1f311/>

## 0.18.5 -  Apple Silicon Release

### Changed

Get the newest mixes in your ear quicker [app startup speed] and chewing less power with the new Apple Silicon release target. Also a new Electron major version bump.

- Update dependency `electron` from v15.3.0 to **v17.1.0**
- Update dependency `electron-builder` from v22.13.1 to **v22.14.13**
- Update dependency `electron-context-menu` from v3.1.1 to **v3.1.2**
- Update dependency `electron-updater` from v4.3.9 to **v4.6.5**
- Update dependency `keytar` from v7.7.0 to **v7.9.0**
- Update dependency `electron-config` from v2.0.0 to `electron-store` **v8.0.1** (same dep, but new name & version)
- Removed `electron-is-dev`

Release Track: 🎵 <https://www.mixcloud.com/naroma/polyester-schwestern/>

## 0.18.0 - You [un]blocked me on Facebook

### Changed

While updating the code to change from using an Electron deprecated window handling method, we were also able to make an allowance for facebook.com for anyone wanting to login to Mixcloud using their Facebook login (closes #59)

### Dependency Updates

-Update from Electron 12 to Electron 13

Release Track: 🎵 <https://www.mixcloud.com/christopherpena5/you-blocked-me-on-facebook/>

## 0.16.0 - Remember me?

### Changed

From this release your login details will be captured and stored in your device Keystore (Keychain) so when your session expires and you see the Mixcloud homepage, just click the "Login" link and you stored details will be submitted and boom, you're ready to listen to beats with a click (no keyboard required).

If you want to clear your login (or switch to another account) use the "Logout" menu item from the Mixcloud Play menu.

This release also includes a **massive** Electron version bump (Electron v4.2.12 -> v12.0.2) so probably expect some performance & security benefits (the usual things with new dependencies).

Release track: <https://www.mixcloud.com/artimix/2017-07-02a-blue-boy-remember-me-mixtape-using-ipod-only/>

## 0.13.0 - Copy & Paste, Release

### Changed

The "copy & paste" Release allows you to do just that, you can now copy & paste your comment or a search term using the right-click context menu (you could before only if you knew the famous universal keyboard short-cuts).

But that's not all:
- you can also correct spelling mistakes (just by right clicking on them and picking a suggestion)

## 0.12.0 - Release 0.12.0

### Changed

- DOM Hooks fixed to Mixcloud.com so track notifications work again
- Electron updated to v4.2.12 (from v3.1.13)

## 0.11.6 - App drag area changes

### Changed

- Restricted app drag area to just the menus and advert area at the top of the screen - Issue #34

## 0.11.5 - Media Keys working

### Fixed

- Please [see the README](/mountainash/Mixcloud-Play/tree/26-mediakeys#enable-media-controls) for enabling macOS permissions. #26

## 0.11.2 - Track & Artists Notification improvements

### Fixed

- Fetching & Cleaning Track meta correctly
- small CSS adjustments to the mixcloud site for the macOS window controls
- pinning package version numbers
- Closes #18

## 0.11.1 - Auto Update

### Changed

- auto update (checking against new versions on GitHub Releases)
- reverted to npm from yarn
- removed webpack (file structure simplified)
  - no hackery between local electron and build
- much increased security (no node.js in webview)

## 0.9.7 - Bug Fixes & Code Trimming

### Changed

- Removed Analytics tracking + packages (not cool, esp. without a Privacy statement)
- Removed (non-working) Preference window
- Removed React and all it's bulk
- Removed a few other unused packages
- Fixed JS error on notification click
- Added Docker-compose file and instructions for cleaner/safer development
- more meta data in the package.json
