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

const { autoUpdater } = require('electron-updater');
const path = require('path');
const menuTemplate = require('./menu.js');
const menu = Menu.buildFromTemplate(menuTemplate);
const fs = require('fs');
const Config = require('electron-config');
const config = new Config();


const BASE_URL = 'https://www.mixcloud.com/';
const DEBUG = process.env.ELECTRON_DEBUG || false;

if (DEBUG)
	console.log(JSON.stringify(process.env, null, 4));

let win = null;
let page;
let isQuitting = false;

let tray = null;
let contextMenu = null;
var _isPlaying = false;

const isRunning = app.requestSingleInstanceLock();
app.allowRendererProcessReuse = true;
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

if (!isRunning) {
	app.quit();
}

app.on('second-instance', () => {
	if (win) {
		if (win.isMinimized()) win.restore();
		win.show();
	}
});

const toggleWindow = () => {
	win.show();
	win.focus();
}

const initTray = () => {
	if (!tray) {
		tray = new Tray(path.join(__dirname, './static/logoTemplate.png'));
		tray.on('click', togglePlay);
		tray.on('right-click', displayContextMenu);
		tray.on('double-click', toggleWindow);
	}

	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Play/Pause',
			click: () => { togglePlay() }
		},
		// { label: 'Open website', click: () => { shell.openExternal( {Playing track's URL}) } },
		{ type: 'separator' },
		{ label: 'Give feedback', click: () => { shell.openExternal('https://github.com/uffou/MixCloud-Play/issues') } },
		{ label: 'Quit', click: () => { app.quit() } }
	]);
};

function displayContextMenu() {
	tray.popUpContextMenu(contextMenu);
}

app.on('activate', () => { win.show() });
app.on('before-quit', () => isQuitting = true);

app.on('ready', () => {
	initTray();
	Menu.setApplicationMenu(menu);

	autoUpdater.checkForUpdatesAndNotify();

	let opts = {
		type: 'textured',
		show: false,
		titleBarStyle: 'hiddenInset',
		icon: path.join(__dirname, 'MixCloud.icns'),
		backgroundColor: '#ADADAD',
		width: 1100,
		minWidth: 768,
		height: 800,
		minHeight: 400,
		acceptFirstMouse: true,
		webPreferences: {
			// nodeIntegration: false,
			nodeIntegration: true, //TODO turn this off
			preload: path.join(__dirname, 'browser.js'),
			plugins: true,
			partition: 'persist:mixcloud'
		}
	};
	Object.assign(opts, config.get('winBounds'));

	win = new BrowserWindow(opts);

	win.loadURL(BASE_URL);

	page = win.webContents;

	page.on('new-window', (event, url) => {
		shell.openExternal(url);
		event.preventDefault();
	});

	if (DEBUG) {
		app.dock.setBadge('DEBUG');
		win.openDevTools();

		page.on('did-frame-finish-load', () => {
			page.openDevTools();
		});
	};

	page.on('dom-ready', () => {
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'browser.css'), 'utf8'));
		win.show();
	});

	win.on('close', (e) => {
		if (!isQuitting) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				win.hide();
			}
		} else {
			// save window size and position
			config.set('winBounds', win.getBounds());
		}
	});

    // mainWindow.on('focus', () => {
    //     // app.dock.setBadge('');
    // });

    // Load our media keys
	// Originally copied from https://gist.github.com/twolfson/0a03820e27583cc9ad6e
	// Docs: https://www.electronjs.org/docs/api/global-shortcut
	// Electron and launching app (Terminal or VSCode) need to be approved: https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html
    var registered = globalShortcut.register('MediaNextTrack', () => {
        console.log('medianexttrack pressed');
        page.send('next');
    });
    if (!registered) {
        console.log('medianexttrack registration failed');
    } else {
        console.log('medianexttrack registration bound!');
    }

    var registered = globalShortcut.register('MediaPlayPause', () => {
        console.log('MediaPlayPause pressed', _isPlaying);
		togglePlay();
    });
    if (!registered) {
        console.log('MediaPlayPause registration failed');
    } else {
        console.log('MediaPlayPause registration bound!');
    }

    var registered = globalShortcut.register('MediaPreviousTrack', () => {
        console.log('mediaprevioustrack pressed');
    });
    if (!registered) {
        console.log('mediaprevioustrack registration failed');
    } else {
        console.log('mediaprevioustrack registration bound!');
    }

    var registered = globalShortcut.register('MediaStop', () => {
        console.log('mediastop pressed');
    });
    if (!registered) {
        console.log('mediastop registration failed');
    } else {
        console.log('mediastop registration bound!');
    }
});

app.on('will-quit', () => {
	// Unregister all shortcuts
	globalShortcut.unregisterAll();
});

ipcMain.on('notification', (_event, notificationIndex, subtitle) => {
    if (win.isFocused()) return;

	// app.dock.setBadge("!");

    const notification = new Notification({
        title: 'Mixcloud Play',
        subtitle,
        silent: true
    });
    notification.on('click', (e) => {
		console.log('notificationClicked - click', e);
        page.send('notificationClicked', e);
        win.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

ipcMain.on('handlePause', (_, track) => {
    app.dock.setBadge('||'); // kind of looks like a "pause" symbol

	tray.setTitle(track + ' (paused)');

	page.send('notify', track);
    const notification = new Notification({
        title: 'Show Paused',
        subtitle: track,
        silent: true
    });
	notification.on('click', (e) => {
		console.log('notificationClicked - pause', e);
        page.send('notificationClicked', e);
        win.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

ipcMain.on('nowPlaying', (_, title, subtitle) => {
	console.log(`${title} ${subtitle}`);
    app.dock.setBadge('');

	const notification = new Notification({
		title: title,
		subtitle: subtitle,
		silent: true
	});
	notification.on('click', (e) => {
		console.log('notificationClicked - nowPlaying', e);
		page.send('notificationClicked', e);
		win.show();
	});
	notification.show();
	setTimeout(() => {
		notification.close();
	}, 15000);
});

ipcMain.on('handlePlay', (_, track) => {
    app.dock.setBadge('');

    tray.setTitle(track)

	const notification = new Notification({
        title: 'Playing...',
        subtitle: track,
        silent: true
    });
    notification.on('click', (e) => {
		console.log('notificationClicked - handlePlay', e);
        page.send('notificationClicked', e);
        win.show();
    });
    notification.show();
    setTimeout(() => {
        notification.close();
    }, 7000);
});

function togglePlay() {
	_isPlaying = !_isPlaying;
	page.send('playPause');
	console.log('Toggle Play:', _isPlaying);
	return _isPlaying;
}

/* Auto Update menu */
autoUpdater.on('checking-for-update', () => {
	const msg = 'Checking for update...';
	console.log(msg);
	page.send('notify', msg);
});
autoUpdater.on('update-available', (info) => {
	const msg = 'Update available.';
	console.log(msg);
	page.send('notify', msg);
});
autoUpdater.on('update-not-available', (info) => {
	const msg = 'Update not available.';
	console.log(msg);
	page.send('notify', msg);
});
autoUpdater.on('error', (err) => {
	const msg = 'Error in auto-updater. ' + err;
	console.log(msg);
	page.send('notify', msg);
});
autoUpdater.on('download-progress', (progressObj) => {
	const msg = 'Downloaded ' + progressObj.percent + '%';
	console.log(msg);
	page.send('notify', msg);
});
autoUpdater.on('update-downloaded', (info) => {
	const msg = 'Update downloaded. Restart to update';
	console.log(msg);
	page.send('notify', msg);
});