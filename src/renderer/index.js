const { ipcRenderer } = require('electron');
import * as path from 'path'

const BASE_URL = 'https://www.mixcloud.com';
const DEBUG = process.env.ELECTRON_WEBPACK_APP_DEBUG || false
const LOCAL = process.env.ELECTRON_WEBPACK_APP_LOCAL || false

if (DEBUG)
	console.info(JSON.stringify(process.env, null, 4))
	console.info(__dirname)
	console.info(__static)

const getStatic = (val) => {
	if (LOCAL) {
		return path.resolve(__dirname, '../../static/' + val) // __dirname is /build/renderer/
	}
	return path.resolve(__static, val)
}

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
	console.log('didFinishLoad')
	webview.removeEventListener('did-finish-load', didFinishLoad)
	webview.send('init')
}
webview.addEventListener('did-finish-load', didFinishLoad)

// Set Window Title
webview.addEventListener('page-title-updated', ({title}) => {
	document.title = `${title} | Mixcloud Play`
})

// Inserting CSS
const link = document.createElement('link')
link.href = getStatic('style.css') // as it's location moves for different compiles
link.type = 'text/css'
link.rel = 'stylesheet'
document.getElementsByTagName('head')[0].appendChild(link)

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

// Open all links in external browser
document.addEventListener('click', function(event) {
	if (event.target.href) {
		console.log(event.target.href)
	}
	if (event.target.tagName === 'A' && event.target.href.startsWith('http') &&
	!event.target.href.includes('https://www.mixcloud.com/')) {
		event.preventDefault()
		shell.openExternal(event.target.href)
	}
})

if (DEBUG) {
	document.getElementsByTagName('body')[0].className = 'DEBUG'
	webview.addEventListener('dom-ready', () => {
		webview.openDevTools()
	});
	// webview.addEventListener('console-message', (e) => {
	// 	console.log('Guest page logged a message:', e.message)
	// });
}