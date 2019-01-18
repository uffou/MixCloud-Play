const { ipcRenderer } = require('electron');
const contextMenu = require('electron-context-menu');

const BASE_URL = 'https://www.mixcloud.com';
function concatEndpoints(endpoints){
	for(const i in endpoints){
		endpoints[i] = BASE_URL + endpoints[i];
	}

	return endpoints;
}
const Endpoints = concatEndpoints({
	DASHBOARD: '/'
})

const webview = document.getElementById('webview');
function didFinishLoad(){
	contextMenu({window: webview})
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

ipcRenderer.on('updatedPreferences', () => {
	webview.send('updatedPreferences');
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

