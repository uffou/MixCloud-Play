const { ipcRenderer, webFrame, shell } = require('electron');

const webview = document;
const BASE_URL = 'https://www.mixcloud.com';
const DEBUG = process.env.ELECTRON_DEBUG || false;

if (DEBUG)
	console.info(JSON.stringify(process.env, null, 4));

function concatEndpoints(endpoints) {
	for (const i in endpoints) {
		endpoints[i] = BASE_URL + endpoints[i];
	}

	return endpoints;
}

const Endpoints = concatEndpoints({
	DASHBOARD: '/dashboard/',
	NEWSHOWS: '/dashboard/new-uploads/'
});

// webview.getSettings().setMediaPlaybackRequiresUserGesture(false); // to allow autoplay set by website

webview.addEventListener('permissionrequest', ({ e }) => {
	console.log('permission requested');

	if (e.permission === 'media') {
		e.request.allow();
	}
});

function didFinishLoad() {
	console.log('didFinishLoad');
	webview.removeEventListener('did-finish-load', didFinishLoad);
	webview.send('init');
}
webview.addEventListener('did-finish-load', didFinishLoad);

// Set Window Title
webview.addEventListener('page-title-updated', ({ title }) => {
	webview.title = `${title} | Mixcloud Play`;
});

ipcRenderer.on('goToDashboard', () => {
	console.log('ipcRenderer: goToDashboard');
	webview.location = Endpoints.DASHBOARD;
});

ipcRenderer.on('goToNewShows', () => {
	console.log('ipcRenderer: goToNewShows');
	webview.location = Endpoints.NEWSHOWS;
});

ipcRenderer.on('notificationClicked', (_, notificationIndex) => {
	webview.send('notificationClicked', notificationIndex);
});

// MIXCLOUD
ipcRenderer.on('playPause', () => {
	console.log('ipcRenderer: playPause');
	webview.send('playPause');
});
ipcRenderer.on('next', () => {
	console.log('ipcRenderer: next');
	webview.send('next');
});

// Open all links in external browser
webview.addEventListener('click', function(event) {
	if (event.target.href) {
		console.log(event.target.href);
	}
	if (event.target.tagName === 'A' && event.target.href.startsWith('http') && !event.target.href.includes('https://www.mixcloud.com/')) {
		event.preventDefault();
		shell.openExternal(event.target.href);
	}
});

if (DEBUG) {
	webview.addEventListener('dom-ready', () => {
		webview.openDevTools();
	});
	// webview.addEventListener('console-message', (e) => {
	// 	console.log('Guest page logged a message:', e.message)
	// });
}

// #region Notification
const notifications = [];
const NotificationOriginal = Notification;
function NotificationDecorated(title) {
	const notification = {
		_handleClick: [],
		close() {},
		addEventListener(type, callback) {
			if (type !== 'click') return;

			this._handleClick.push(callback);
		},
		click() {
			for (const callback of this._handleClick) {
				callback.call(this);
			}
		}
	}

	ipcRenderer.send('notification', notifications.push(notification) - 1, title);
	return notification;
}

Object.defineProperties(NotificationDecorated, {
	permission: {
		get() { return NotificationOriginal.permission }
	},
	maxActions: {
		get() { return NotificationOriginal.maxActions }
	},
	requestPermission: {
		get() { return NotificationOriginal.requestPermission }
	}
});

window.Notification = NotificationDecorated;
// #endregion

// #region Custom notification sound
webFrame.registerURLSchemeAsBypassingCSP('file');

const AudioOriginal = Audio;
const beaconNotificationRegex = /beacon-notification\.(?:.*)$/;

function createObserverCallback(tagName, callback) {
	return function(records) {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (node.tagName === tagName) {
					callback();
				}
			}
		}
	}
}

ipcRenderer.on('notificationClicked', (_, notificationIndex) => {
	const originalOpen = window.open;
	window.open = (url) => {
		window.location = url;
	}
	notifications[notificationIndex].click();
	window.open = originalOpen;
});

ipcRenderer.on('playPause', () => {
	console.log('playPause');
	const playPause = document.querySelector('[class*=PlayButton__PlayerControl]');
	if (playPause)
		playPause.click();
});

ipcRenderer.on('next', () => {
	// TODO
	console.log('next');
	const row = Array.from(document.getElementsByClassName('cloudcast-upnext-row'));
	const nowPlaying = row.findIndex(song => song.classList.contains('now-playing'));
	const children = Array.from(row[nowPlaying + 1].childNodes);
	const image = children.find(child => child.classList.contains('cloudcast-row-image'));
	if (image)
		image.click();
});

// ipcRenderer.on('init', () => {
webview.addEventListener('DOMContentLoaded', () => {
	let currentArtist = '';
	let currentTrack = '';

	setInterval(() => {
		console.log('currentTrack', currentTrack, 'currentArtist', currentArtist);

		const titleElement = webview.querySelector('[class*=RebrandPlayerSliderComponent__Artist]');
		if (!titleElement) return;

		const title = titleElement.innerText;
		if (title !== currentArtist) {
			currentArtist = String(title);
			console.log('New Artist', currentArtist);
			ipcRenderer.send('handlePlay', currentArtist);
		}

		let trackElement = webview.querySelector('[class*=RebrandPlayerSliderComponent__Track-]');
		if (!trackElement) return;

		let track = webview.querySelector('[class*=RebrandPlayerSliderComponent__Track-]').innerText;
		if (track !== currentTrack) {
			let trackTruncated = track.replace(/[\u2014\u002d]\sbuy$/gi, '');
			trackTruncated = trackTruncated.replace('by ', '');

			currentTrack = trackTruncated;
			console.log('New Track', currentTrack);

			let notificationSubtitle = 'Mixcloud Play';

			ipcRenderer.send('nowPlaying', currentTrack, title, notificationSubtitle);
		}
	}, 2000);
});

//Elements
webview.addEventListener('click', function(event) {
	const playPause = webview.querySelector('[class*=PlayButton__PlayerControl]');
	const eventPath = event.path || (event.composedPath && event.composedPath()) || [];
	const playPauseClicked = eventPath.find(path => path === playPause);
	if (playPauseClicked) {
		console.log(playPauseClicked);
		const paused = playPauseClicked.classList.contains('dvjoTG');
		console.log(paused);
		let trackElement = webview.querySelector('[class*=RebrandPlayerControls__ShowTitle]');
		if (!trackElement) return;

		let track = trackElement.innerText;
		console.log(track);
		ipcRenderer.send(paused ? 'handlePause' : 'handlePlay', track);
	}
	console.log(playPauseClicked);
});