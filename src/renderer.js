const { ipcRenderer } = require('electron');

// const logger = require('electron').remote.require('./logger');
// logger.log('Woohoo!');

const BASE_URL = 'https://www.mixcloud.com';
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

function didFinishLoad() {
	webview.removeEventListener('did-finish-load', didFinishLoad)
	webview.send('init');
}
webview.addEventListener('did-finish-load', didFinishLoad)

webview.addEventListener('page-title-updated', ({title}) => {
	document.title = `${title} | MixCloud Play`;
});

ipcRenderer.on('goBack', () => {
	webview.goBack();
})

ipcRenderer.on('goForward', () => {
	webview.goForward();
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

HUDplay.addEventListener('click', (e) => {
	e.preventDefault();
	HUDcontrols.className = (HUDcontrols.className == 'play') ? '' : 'play';
	// logger.log('webviewsend: playPause');
	console.log('webviewsend: playPause')
	webview.send('playPause');
});
HUDnext.addEventListener('click', (e) => {
	e.preventDefault();
	// logger.log('webviewsend: next');
	console.log('webviewsend: next')
	webview.send('next');
});