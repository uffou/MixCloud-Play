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
const contextMenu = require('electron-context-menu');
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
let trayContextMenu = null;
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
};

const initTray = () => {
	if (!tray) {
		tray = new Tray(path.join(__dirname, './static/logoTemplate.png'));
		tray.on('click', togglePlay);
		tray.on('right-click', displayTrayContextMenu);
		tray.on('double-click', toggleWindow);
	}

	trayContextMenu = Menu.buildFromTemplate([
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

function displayTrayContextMenu() {
	tray.popUpContextMenu(trayContextMenu);
}

function basicURL(url) {
	if (typeof url !== 'string') return false;

	const parsed = new URL(url);
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
		return false;

	return true;
}

function isURLAllowed(url) {
	return [
		/^https:\/\/www\.facebook\.com\/.*/i,
		/^https:\/\/www\.mixcloud\.com\/.*/i
	].some((re) => url.match(re));
}

app.on('activate', () => { win.show() });
app.on('before-quit', () => isQuitting = true);

app.on('ready', () => {
	initTray();
	contextMenu();

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
			nodeIntegration: false,
			preload: path.join(__dirname, 'browser.js'),
			plugins: true,
			partition: 'persist:mixcloud',
			spellcheck: true
		}
	};
	Object.assign(opts, config.get('winBounds'));

	win = new BrowserWindow(opts);

	win.loadURL(BASE_URL);

	page = win.webContents;

	// Open new browser window on external open
	page.setWindowOpenHandler(({url}) => {
		if (url.startsWith('https://www.facebook.com/')) return { action: 'allow' };
		else if (basicURL(url)) shell.openExternal(url);
		return { action: 'deny' };
	});

	page.on('will-navigate', (e, url) => {
		if (basicURL(url) && !isURLAllowed(url)) {
			e.preventDefault();
			shell.openExternal(url);
		}
	});

	page.on('will-redirect', (e, url) => {
		// `will-navigate` doesn't catch redirects
		if (basicURL(url) && !isURLAllowed(url)) {
			e.preventDefault();
			win.loadURL(BASE_URL);
			shell.openExternal(url);
		}
	});

	if (DEBUG) {
		app.dock.setBadge('DEBUG');
		win.openDevTools();

		page.on('did-frame-finish-load', () => {
			page.openDevTools();
		});
	}

	page.on('dom-ready', () => {
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'browser.css'), 'utf8'));
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'src/notie.css'), 'utf8'));
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
		console.log('MediaNextTrack pressed');
		page.send('seek');
	});
	if (!registered) {
		console.log('MediaNextTrack registration failed');
	} else {
		console.log('MediaNextTrack registration bound!');
	}

	registered = globalShortcut.register('MediaPlayPause', () => {
		console.log('MediaPlayPause pressed', _isPlaying);
		togglePlay();
	});
	if (!registered) {
		console.log('MediaPlayPause registration failed');
	} else {
		console.log('MediaPlayPause registration bound!');
	}

	registered = globalShortcut.register('MediaPreviousTrack', () => {
		console.log('MediaPreviousTrack pressed');
		page.send('back');
	});
	if (!registered) {
		console.log('MediaPreviousTrack registration failed');
	} else {
		console.log('MediaPreviousTrack registration bound!');
	}

	registered = globalShortcut.register('MediaStop', () => {
		console.log('MediaStop pressed');
	});
	if (!registered) {
		console.log('MediaStop registration failed');
	} else {
		console.log('MediaStop registration bound!');
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

	tray.setTitle(track);

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