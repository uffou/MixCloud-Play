const path = require(`path`);

const {
	app,
	BrowserWindow,
	globalShortcut,
	ipcMain,
	Menu,
	Notification,
	Tray,
} = require(`electron`);
const contextMenu = require('electron-context-menu');
const ConfigStore = require(`electron-store`);

const SoundValues = require(`./@enum/SoundValues`);

const configStoreDefaults = require(`./@util/configStoreDefaults`);

const menuTemplate = require(`./menu`);

let preferencesWindow;
function openPreferences(){
	preferencesWindow = new BrowserWindow({
		width: 400,
		height: 400,
	});
	contextMenu({window: preferencesWindow})
	preferencesWindow.webContents.loadFile(path.join(__dirname, 'preferences', 'index.html'))

	preferencesWindow.on('close', () => {
		preferencesWindow = undefined;
	})
}

let mainWindow;
let tray

const toggleWindow = () => {
	if (mainWindow.isVisible()) {
		mainWindow.hide();
	} else {
		mainWindow.show();
		mainWindow.focus();
	}
};

const createTray = () => {
	tray = new Tray(path.join(__dirname, './img/logoTemplate.png'));
	tray.on('right-click', toggleWindow);
	tray.on('double-click', toggleWindow);
	tray.on('click', (event) => {
		toggleWindow();
	});
};

menuTemplate.setPreferencesClickHandler(openPreferences);
menuTemplate.setDashboardClickHandler(() => {
	mainWindow.webContents.send('goToDashboard');
})
const menu = Menu.buildFromTemplate(menuTemplate)

function closeHandler(event){
	event.preventDefault();

	mainWindow.hide();
}

app.on('ready', () => {
	createTray();
	Menu.setApplicationMenu(menu);

	mainWindow = new BrowserWindow({
		titleBarStyle: 'hiddenInset',
		width: 1100,
		minWidth: 768,
		height: 800,
		minHeight: 400,
	});

	mainWindow.webContents.loadFile(path.join(__dirname, 'index.html'))

	// mainWindow.webContents.openDevTools();

	mainWindow.on('focus', () => {
		// app.dock.setBadge("");
	});

	mainWindow.on('close', closeHandler)

	// Load our media keys
	// Copied from https://gist.github.com/twolfson/0a03820e27583cc9ad6e
	var registered = globalShortcut.register('medianexttrack', function () {
		console.log('medianexttrack pressed');
		mainWindow.webContents.send('next');
	});
	if (!registered) {
		console.log('medianexttrack registration failed');
	} else {
		console.log('medianexttrack registration bound!');
	}

	var registered = globalShortcut.register('mediaplaypause', function () {
		console.log('mediaplaypause pressed');
		mainWindow.webContents.send('playPause');
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

app.on('activate', () => {
	!preferencesWindow && mainWindow && mainWindow.show();
});

app.on('before-quit', () => {
	mainWindow && mainWindow.removeListener('close', closeHandler);
});

const configStore = new ConfigStore({defaults: configStoreDefaults});
ipcMain.on('notification', (_event, notificationIndex, subtitle) => {
	if(mainWindow.isFocused()) return;

	// app.dock.setBadge("!");

	const notification = new Notification({
		title: 'MixCloud Play',
		subtitle,
		silent: configStore.get('soundValue') !== SoundValues.OPERATING_SYSTEM
	});
	notification.on('click', () => {
		mainWindow.webContents.send('notificationClicked', notificationIndex);
		mainWindow.show();
	});
	notification.show();
	setTimeout(() => {
		notification.close();
	}, 7000);
});

ipcMain.on('handlePause', (_,track) => {
	// app.dock.setBadge("!");

	tray.setTitle(track + ' (paused)')
	const notification = new Notification({
		title: 'Mix Paused',
		subtitle: track,
		silent: configStore.get('soundValue') !== SoundValues.OPERATING_SYSTEM
	});
	notification.on('click', () => {
		mainWindow.webContents.send('notificationClicked', notificationIndex);
		mainWindow.show();
	});
	notification.show();
	setTimeout(() => {
		notification.close();
	}, 7000);
});

ipcMain.on('nowPlaying', (_,nowPlaying) =>{
	console.log(nowPlaying)
	tray.setTitle(nowPlaying);
})

ipcMain.on('handlePlay', (_,track) => {
	// app.dock.setBadge("!");
	
	tray.setTitle(track)
	const notification = new Notification({
		title: 'Playing...',
		subtitle: track,
		silent: configStore.get('soundValue') !== SoundValues.OPERATING_SYSTEM
	});
	notification.on('click', () => {
		mainWindow.webContents.send('notificationClicked', notificationIndex);
		mainWindow.show();
	});
	notification.show();
	setTimeout(() => {
		notification.close();
	}, 7000);
});

ipcMain.on('updatedSound', () => {
	mainWindow.webContents.send('updatedSound');
})
