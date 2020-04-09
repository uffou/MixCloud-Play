Mixcloud Play
=====
Mixcloud Play is the missing desktop experience for [Mixcloud.com](https://www.mixcloud.com/) with support for media controls and showing current track in menu bar. Enjoy listening to hours of new music...

## [Download for Mac](https://github.com/mountainash/Mixcloud-Play/releases/latest)

[![screenshot](https://raw.githubusercontent.com/mountainash/Mixcloud-Play/master/Screenshot.png)](https://github.com/mountainash/Mixcloud-Play/releases/latest)

## Features
1. Media controls - play/pause, next {broken}
2. Menu bar track title
3. Song Notifications
4. Modern desktop look
5. Last.fm Scrobbing (_comming soon_)

## Development
### Building
```sh
npm install
npm build
```
**OR**
```sh
npm start
```

Use the compile macOS .app with Dev Tools and some extra debugging enabled:

```sh
npm build:debug
```

### Docker Compose
```sh
docker-compose build
docker-compose run --rm mixcloud-play {any command here}
```

Built app will output to `./dist/mac/Mixcloud Play.app`

### Auto Update Publishing (GitHub)

Publish app updates is set-up as per the [GithubOptions](https://www.electron.build/configuration/publish#githuboptions) for Electron Build's [Auto Update](https://www.electron.build/auto-update).

```sh
export GH_TOKEN={token_with_repo_scope}
npm run publish:draft
```

A release in the specified GitHub repo should be drafted and ready for release.

### Development Tips
#### Asar Extract
Linking/locating files inside the build can be hard to know what's going on inside the app.asar (inside Electron). Us the following commands to extract the contents of the .asar.

1. Build the app fist `docker-compose run --rm mixcloud-play`
1. `docker run --rm -it -v $(pwd):/project electronuserland/builder:12-11.19` to enter bash inside the container
1. `npm install -g asar`
1. `asar extract dist/mac/Mixcloud\ Play.app/Contents/Resources/app.asar app_contents` will extract the MacOS "dist" contents to `/app_contents/`