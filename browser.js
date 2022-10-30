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

// Object for storing the current show info
const showInfo = {
	isPlaying: false,
	showName: '',
	showOwner: '',
	// showImage: '', // not in use
	trackArtist: '',
	trackTitle: '',
};

// The web-scrobbler project can help with these selectors when MixCloud change the DOM
// https://github.com/web-scrobbler/web-scrobbler/blob/master/src/connectors/mixcloud.js
const DomHooks = {
	playbutton: '[class*=PlayButton__PlayerControl]',
	seekbutton: '[aria-label="Seek forwards"]',
	backbutton: '[aria-label="Seek backwards"]',
	showname: '[class*=PlayerControls__ShowTitle]',
	showowner: '[class*=PlayerControls__ShowOwnerName]',
	tracktitle: '[class*=PlayerSliderComponent__Track-]',
	trackartist: '[class*=PlayerSliderComponent__Artist]',
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

ipcRenderer.on('logOut', async() => {
	console.log('ipcRenderer: logOut');
	keyStore.Logout();
});

if (DEBUG) {
	webview.addEventListener('dom-ready', () => {
		webview.openDevTools();
	});
	webview.addEventListener('console-message', (event) => {
		console.log('Guest page logged a message:', event.message);
	});
}

ipcRenderer.on('triggerPlayPause', () => {
	console.log('triggerPlayPause');
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

webview.addEventListener('DOMContentLoaded', () => {
	setInterval(() => {
		console.log('showInfo:', showInfo);

		// Check if the play state has changed (normally by media keys (as we only have events for the Mixcloud play button))
		const current_state = showInfo.isPlaying;

		checkPlayingState();

		if (current_state !== showInfo.isPlaying) {
			ipcRenderer.send('displayNotification', showInfo);
			return;
		}

		if (showInfo.isPlaying) {
			// get track artist and clean
			let artistElement = webview.querySelector(DomHooks.trackartist);
			if (!artistElement) return;

			let artist = artistElement.innerText;
			artist = String(artist);
			artist = artist.replace(/[\u2014\u002d]\sbuy$/gi, '');
			artist = artist.replace(/(by )/, '');

			if (artist !== showInfo.trackArtist) {
				showInfo.trackArtist = artist;
				console.log('New Artist:', artist);
			}

			// get track title and clean
			const titleElement = webview.querySelector(DomHooks.tracktitle);
			if (!titleElement) return; // element doesn't exist if the show doesn't have a tracklist

			let title = titleElement.innerText;
			title = String(title);

			if (title !== showInfo.trackTitle) {
				console.log('New Track:', title);
				showInfo.trackTitle = title;

				if (title !== '')
					ipcRenderer.send('displayNotification', showInfo);
			}
		} else {
			// Login form prefill
			// login will only show when not playing (so reduce checks/lookups)
			let loginform = webview.querySelector(DomHooks.loginform);

			if (!loginform || loginform.dataset.listened) return; // only attach an event to the form once
			loginform.dataset.listened = true;

			console.log('login showing');
			keyStore.Login(loginform); // try using saved login

			// add a listener to the form to capture login details and store them
			const loginbutton = loginform.querySelector(DomHooks.loginbutton);

			loginbutton.addEventListener('click', async() => {
				let username = loginform.querySelector(DomHooks.usernameinput).value;
				let password = loginform.querySelector(DomHooks.passwordinput).value;

				if (username && password) {
					// delete any exiting logins
					await keyStore.DeleteKeys();
					// store the users details for auto-login next time
					await keyStore.AddKey(username, password);
				}
			});
		}
	}, 2000);
});

const checkPlayingState = () => {
	const playPauseButton = webview.querySelector(DomHooks.playbutton);
	if (!playPauseButton) return null;

	const button_aria = playPauseButton.getAttribute('aria-label') === 'Pause'; // when it's paused, the aria-label is 'Play'
	showInfo.isPlaying = button_aria; // set global var
	console.log('isPlaying:', showInfo.isPlaying);
};

webview.addEventListener('click', (event) => {
	const eventPath = event.composedPath && event.composedPath() || [];
	const playPauseClicked = eventPath.find(path => path === webview.querySelector(DomHooks.playbutton));

	if (playPauseClicked) {
		checkPlayingState();

		const trackElement = webview.querySelector(DomHooks.showname);
		showInfo.showName = trackElement ? trackElement.innerText : '';

		console.log('showName:', showInfo.showName);
		ipcRenderer.send('displayNotification', showInfo);
	}
});