const {
    app,
    BrowserWindow,
    globalShortcut,
    ipcMain,
    Menu,
    Notification,
    Tray,
    shell
} = require('electron');

const path = require('path');
const menuTemplate = require('./menu.js');
const menu = Menu.buildFromTemplate(menuTemplate);
const fs = require('fs');
const Config = require('electron-config');
const config = new Config();

const DEBUG = process.env.ELECTRON_DEBUG || false;

if (DEBUG)
	console.log(JSON.stringify(process.env, null, 4));

let mainWindow = null;
let page;
let isQuitting = false;

let tray = null;
let contextMenu = null;
var _isPlaying = false;

const isRunning = app.requestSingleInstanceLock();

if (!isRunning) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.show();
	}
});

const toggleWindow = () => {
	mainWindow.show();
	mainWindow.focus();
}

const initTray = () => {
	if (!tray) {
		tray = new Tray(path.join(__dirname, './static/logoTemplate.png'));
		tray.on('click', togglePlay);
		tray.on('right-click', displayContextMenu);
		tray.on('double-click', toggleWindow);
	}

	contextMenu = Menu.buildFromTemplate([
		// {
		// 	label: 'Play',
		// 	checked: togglePlay(),
		// 	click: () => { togglePlay() }
		// },
		// { label: 'Open website', click: () => { shell.openExternal( {Playing track's URL}) } },
		{ type: 'separator' },
		{ label: 'Give feedback', click: () => { shell.openExternal('https://github.com/uffou/MixCloud-Play/issues') } },
		{ label: 'Quit', click: () => { app.quit() } }
	]);
};

function displayContextMenu() {
	tray.popUpContextMenu(contextMenu);
}

app.on('activate', () => { mainWindow.show() });
app.on('before-quit', () => isQuitting = true);

app.on('ready', () => {
	initTray();
    Menu.setApplicationMenu(menu);

	let opts = {
		show: false,
		title: app.getName(),
		titleBarStyle: 'hidden',
		icon: path.join(__dirname, 'MixCloud.icns'),
		backgroundColor: '#ADADAD',
		width: 1100,
		minWidth: 768,
		height: 800,
		minHeight: 400,
		isMinimizable: false, // don't seem to work in current version
		isMaximizable: false,
		webPreferences: {
			// nodeIntegration: false,
			nodeIntegration: true, //TODO turn this off
			preload: path.join(__dirname, 'browser.js'),
			plugins: true,
			partition: 'persist:mixcloud'
		}
	};
	Object.assign(opts, config.get('winBounds'));

	mainWindow = new BrowserWindow(opts);

	mainWindow.loadURL('https://www.mixcloud.com/');

	page = mainWindow.webContents;

	page.on('new-window', (event, url) => {
		shell.openExternal(url);
		event.preventDefault();
	});

	if (DEBUG) {
		// mainWindow.openDevTools();

		// auto-open dev tools
		page.on('did-frame-finish-load', () => {
			page.openDevTools();
		});
	};

	page.on('dom-ready', function() {
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'browser.css'), 'utf8'));
		mainWindow.show();
	});

	mainWindow.on('close', (e) => {
		if (!isQuitting) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				mainWindow.hide();
			}
		} else {
			// save window size and position
			config.set('winBounds', mainWindow.getBounds());
		}
	});

    // mainWindow.on('focus', () => {
    //     // app.dock.setBadge("");
    // });

    // Load our media keys
    // Copied from https://gist.github.com/twolfson/0a03820e27583cc9ad6e
    var registered = globalShortcut.register('medianexttrack', function () {
        console.log('medianexttrack pressed');
        page.send('next');
    });
    if (!registered) {
        console.log('medianexttrack registration failed');
    } else {
        console.log('medianexttrack registration bound!');
    }

    var registered = globalShortcut.register('mediaplaypause', function () {
        console.log('mediaplaypause pressed');
        page.send('playPause');
    });
    if (!registered) {
        console.log('mediaplaypause registration failed');
    } else {
        console.log('mediaplaypause registration bound!');
    }

    var registered = globalShortcut.register('mediaprevioustrack', function () {
        console.log('mediaprevioustrack pressed');
    });
    if (!registered) {
        console.log('mediaprevioustrack registration failed');
    } else {
        console.log('mediaprevioustrack registration bound!');
    }

    var registered = globalShortcut.register('mediastop', function () {
        console.log('mediastop pressed');
    });
    if (!registered) {
        console.log('mediastop registration failed');
    } else {
        console.log('mediastop registration bound!');
    }
});

ipcMain.on('notification', (_event, notificationIndex, subtitle) => {
    if (mainWindow.isFocused()) return;

    // app.dock.setBadge("!");

    const notification = new Notification({
        title: 'Mixcloud Play',
        subtitle,
        silent: true
    });
    notification.on('click', (e) => {
		console.log('notificationClicked - click', e);
        page.send('notificationClicked', e);
        mainWindow.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

ipcMain.on('handlePause', (_, track) => {
    // app.dock.setBadge("!");

    tray.setTitle(track + ' (paused)')
    const notification = new Notification({
        title: 'Show Paused',
        subtitle: track,
        silent: true
    });
	notification.on('click', (e) => {
		console.log('notificationClicked - pause', e);
        page.send('notificationClicked', e);
        mainWindow.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

ipcMain.on('nowPlaying', (_, nowPlaying, title, subtitle) => {
	console.log(`${nowPlaying} (${title} ${subtitle})`);

    tray.setTitle(nowPlaying);

    const notification = new Notification({
        title: title,
        subtitle: subtitle,
        silent: true
    });
    notification.on('click', (e) => {
		console.log('notificationClicked - nowPlaying', e);
        page.send('notificationClicked', e);
        mainWindow.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 15000);
})

ipcMain.on('handlePlay', (_, track) => {
    // app.dock.setBadge("!");

    tray.setTitle(track)
    const notification = new Notification({
        title: 'Playing...',
        subtitle: track,
        silent: true
    });
    notification.on('click', (e) => {
		console.log('notificationClicked - handlePlay', e);
        page.send('notificationClicked', e);
        mainWindow.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

function togglePlay() {
	_isPlaying = !_isPlaying;
	// page.send('playPause');
	console.log('Toggle Play:', _isPlaying);
	return _isPlaying;
}