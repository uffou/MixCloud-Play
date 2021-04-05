const { ipcRenderer } = require('electron');
const keyStore = require('./src/keystore');

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

var is_playing = false;

// The web-scrobbler project can help with these selectors when MixCloud change the DOM
// https://github.com/web-scrobbler/web-scrobbler/blob/master/src/connectors/mixcloud.js
const DomHooks = {
	playbutton: '[class*=PlayButton__PlayerControl]',
	seekbutton: '[aria-label="Seek forwards"]',
	backbutton: '[aria-label="Seek backwards"]',
	showtitle: '[class*=PlayerControls__ShowTitle]',
	trackartist: '[class*=PlayerSliderComponent__Artist]',
	tracktitle: '[class*=PlayerSliderComponent__Track-]',
	loginform: 'form[name=login]',
	loginbutton: 'button',
	usernameinput: 'input[name=email]',
	passwordinput: 'input[type=password]'
};

const Endpoints = concatEndpoints({
	DASHBOARD: '/dashboard/',
	NEWSHOWS: '/dashboard/new-uploads/'
});

// Set Window Title
webview.addEventListener('page-title-updated', ({title}) => {
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

ipcRenderer.on('logOut', async () => {
	console.log('ipcRenderer: logOut');

	keyStore.Logout();
});

ipcRenderer.on('notificationClicked', (_, notificationIndex) => {
	webview.send('notificationClicked', notificationIndex);
});

if (DEBUG) {
	webview.addEventListener('dom-ready', () => {
		webview.openDevTools();
	});
	webview.addEventListener('console-message', (event) => {
		console.log('Guest page logged a message:', event.message)
	});
}

/* Notifications */
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
	const el_play = document.querySelector(DomHooks.playbutton);
	if (el_play)
		el_play.click();
});

ipcRenderer.on('seek', () => {
	console.log('seek');
	const el_seek = document.querySelector(DomHooks.seekbutton);
	if (el_seek)
		el_seek.click();
});

ipcRenderer.on('back', () => {
	console.log('back');
	const el_back = document.querySelector(DomHooks.backbutton);
	if (el_back)
		el_back.click();
});

ipcRenderer.on('next', () => {
	// TODO - get working
	console.log('next');
	const row = Array.from(document.getElementsByClassName('cloudcast-upnext-row'));
	const nowPlaying = row.findIndex(song => song.classList.contains('now-playing'));
	const children = Array.from(row[nowPlaying + 1].childNodes);
	const image = children.find(child => child.classList.contains('cloudcast-row-image'));
	if (image)
		image.click();
});

ipcRenderer.on('notify', (text) => {
	console.log('notify', text);
	let node = document.createElement('div');

	node.id = 'notify';
	node.innerHTML = 'Notification: ' + JSON.stringify(text);

	webview.body.appendChild(node);
});

webview.addEventListener('DOMContentLoaded', () => {
	let currentTitle = '';
	let currentArtist = '';

	setInterval(() => {
		if (is_playing) {
			console.log('currentTrack:', currentTitle, 'currentArtist:', currentArtist);

			// get track artist and clean
			let artistElement = webview.querySelector(DomHooks.trackartist);
			if (!artistElement) return;

			let artist = artistElement.innerText;
			artist = String(artist);
			artist = artist.replace(/[\u2014\u002d]\sbuy$/gi, '');
			artist = artist.replace(/(by )/, '');

			if (artist !== currentArtist) {
				currentArtist = artist;
				console.log('New Artist:', currentArtist);
			}

			// get track title and clean
			const titleElement = webview.querySelector(DomHooks.tracktitle);
			if (!titleElement) return;

			let title = titleElement.innerText;
			title = String(title);

			if (title !== currentTitle) {
				currentTitle = title;
				console.log('New Track:', currentTitle);

				if (currentTitle !== '')
					ipcRenderer.send('nowPlaying', currentTitle, currentArtist);
			}
		} else {
			let loginform = webview.querySelector(DomHooks.loginform);

			if (!loginform || loginform.dataset.listened) return; // only attach an event to the form once
			loginform.dataset.listened = true;

			console.log('login showing');
			keyStore.Login(loginform); // try using saved login

			// add a listener to the form to capture login details and store them
			const loginbutton = loginform.querySelector(DomHooks.loginbutton);

			loginbutton.addEventListener('click', () => {
				let username = loginform.querySelector(DomHooks.usernameinput).value;
				let password = loginform.querySelector(DomHooks.passwordinput).value;

				if (username && password) {
					// delete any exiting logins
					keyStore.DeleteKeys();
					// store the users details for auto-login next time
					keyStore.AddKey(username, password);
				}
			});
		}
	}, 2000);
});

webview.addEventListener('click', (event) => {
	const playPause = webview.querySelector(DomHooks.playbutton);
	const eventPath = event.path || (event.composedPath && event.composedPath()) || [];
	const playPauseClicked = eventPath.find(path => path === playPause);

	if (playPauseClicked) {
		console.log(playPauseClicked);

		const paused = playPauseClicked.getAttribute('aria-label') == 'Pause';
		is_playing = !paused;
		console.log('Paused', paused);

		const trackElement = webview.querySelector(DomHooks.showtitle);
		let track = trackElement ? trackElement.innerText : '';

		console.log(track);
		ipcRenderer.send(paused ? 'handlePause' : 'handlePlay', track);
	}
});