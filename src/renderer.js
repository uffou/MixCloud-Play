const { ipcRenderer } = require('electron');
const BASE_URL = 'https://www.mixcloud.com';
const DEBUG = false;

// const logger = require('electron').remote.require('./logger');
// logger.log('Woohoo!');

function concatEndpoints(endpoints) {
	for (const i in endpoints) {
		endpoints[i] = BASE_URL + endpoints[i];
	}

	return endpoints;
}
const Endpoints = concatEndpoints({
	DASHBOARD: '/'
});

const webview = document.getElementById('webview');
// webview.getSettings().setMediaPlaybackRequiresUserGesture(false); // to allow autoplay set by website

webview.addEventListener('permissionrequest', ({e}) => {
	console.log('permission requested')

	if (e.permission === 'media') {
		e.request.allow()
	}
})

function didFinishLoad() {
	webview.removeEventListener('did-finish-load', didFinishLoad)
	webview.send('init')
}
webview.addEventListener('did-finish-load', didFinishLoad)

webview.addEventListener('page-title-updated', ({title}) => {
	document.title = `${title} | Mixcloud Play`
})

ipcRenderer.on('goBack', () => {
	webview.goBack()
})

ipcRenderer.on('goForward', () => {
	webview.goForward()
})

ipcRenderer.on('goToDashboard', () => {
	webview.loadURL(Endpoints.DASHBOARD);
})

ipcRenderer.on('reload', () => {
	webview.reload();
})

ipcRenderer.on('notificationClicked', (_, notificationIndex) => {
	webview.send('notificationClicked', notificationIndex);
})

// MIXCLOUD
ipcRenderer.on('playPause', () => {
	webview.send('playPause');
})
ipcRenderer.on('next', () => {
	webview.send('next');
})

// HUD
const HUDcontrols = document.getElementById('controls'),
	HUDplay = document.getElementById('play'),
	HUDpause = document.getElementById('pause'),
	HUDprev = document.getElementById('prev'),
	HUDnext = document.getElementById('next'),
	HUDinfo = document.getElementById('info'),
	HUDtitle = document.getElementById('title'),
	HUDartist = document.getElementById('artist'),
	HUDurl = document.getElementById('url');

function playpause(e) {
	e.preventDefault();
	HUDcontrols.className = (HUDcontrols.className == 'play') ? '' : 'play';
	// logger.log('webviewsend: playPause');
	console.log('webviewsend: playPause')
	webview.send('playPause');
}

HUDplay.addEventListener('click', playpause);
HUDpause.addEventListener('click', playpause);
HUDnext.addEventListener('click', (e) => {
	e.preventDefault();
	// logger.log('webviewsend: next');
	console.log('webviewsend: next')
	webview.send('next');
});

if (DEBUG) {
	webview.addEventListener('dom-ready', () => {
		webview.openDevTools()
	});
	// webview.addEventListener('console-message', (e) => {
	// 	console.log('Guest page logged a message:', e.message)
	// });
}