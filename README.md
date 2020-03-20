Mixcloud Play
=====
Mixcloud Play is the missing desktop experience for [Mixcloud.com](https://www.mixcloud.com) with support for media controls and showing current track in menu bar. Enjoy listening to new music for hours...

## [Download for Mac](https://github.com/mountainash/Mixcloud-Play/releases/download/v0.9.7/MixCloud.Play.app.zip)

![screenshot](https://raw.githubusercontent.com/mountainash/Mixcloud-Play/master/Screenshot.png)

## Features
1. Media controls - play/pause, next
2. Menu bar track title
3. Song Notifications
4. Modern desktop look

## Getting started
## Building
```sh
yarn dist
```

### Development
Download "Electron.app" into the project root.

```sh
yarn
yarn build:local
Electron.app/Contents/MacOS/Electron .
```

Use the compile macOS .app with Dev Tools and some extra debugging enabled.

```sh
yarn
yarn dist:debug
```


### Docker Compose
```sh
docker-compose build
docker-compose run --rm mixcloud-play {any command here}
```

Built app will output to `./dist/mac/Mixcloud Play.app`

## Dev Tips
### Asar Extract
Linking/locating files inside the build can be hard to know what's going on inside the app.asar (inside Electron). Us the following commands to extract the contents of the .asar.

1. Build the app fist `docker-compose run --rm mixcloud-play`
1. `docker run --rm -it -v $(pwd):/project electronuserland/builder:12-11.19` to enter bash inside the container
1. `npm install -g asar`
1. `asar extract dist/mac/Mixcloud\ Play.app/Contents/Resources/app.asar app_contents` will extract the MacOS "dist" contents to `/app_contents/`