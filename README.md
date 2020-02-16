MixCloud Play
=====
MixCloud Play is the missing desktop experience for [MixCloud.com](https://www.mixcloud.com) with support for media controls and showing current track in menu bar. Enjoy listening to new music for hours...

## [Download for Mac](https://github.com/mountainash/MixCloud-Play/releases/download/v0.9.7/MixCloud.Play.app.zip)

![screenshot](https://raw.githubusercontent.com/uffou/MixCloud-Play/master/Screenshot.png)

## Features
1. Media controls - play/pause, next
2. Menu bar track title
3. Song Notifications
4. Modern desktop look

## Getting started
```sh
yarn
yarn watch
yarn start
```

## Building
```sh
yarn dist
OR
yarn pack
```

## Docker
```sh
docker-compose build
docker-compose run --rm mixcloud-play
```
Built app will output to `./dist/mac/MixCloud Play.app`