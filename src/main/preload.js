const path = require(`path`);

const { ipcRenderer, webFrame, shell } = require(`electron`);

console.log('main preload called');

// #region Notification
const notifications = [];
const NotificationOriginal = Notification;
function NotificationDecorated(title) {
	const notification = {
		_handleClick: [],
		close() {},
		addEventListener(type, callback) {
			if(type !== 'click') return;

			this._handleClick.push(callback);
		},
		click() {
			for(const callback of this._handleClick) {
				callback.call(this);
			}
		}
	}

	ipcRenderer.send('notification', notifications.push(notification) - 1, title);
	return notification;
}

Object.defineProperties(NotificationDecorated, {
	permission: {
		get(){
			return NotificationOriginal.permission;
		}
	},
	maxActions: {
		get(){
			return NotificationOriginal.maxActions;
		}
	},
	requestPermission: {
		get(){
			return NotificationOriginal.requestPermission;
		}
	}
})

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
					callback()
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
})

ipcRenderer.on('playPause', () => {
	const playPause = document.querySelector('[class*=PlayButton__PlayerControl]')
	console.log('playPause')
	if (playPause)
		playPause.click()
})

ipcRenderer.on('next', () => {
	// TODO
	const row = Array.from(document.getElementsByClassName('cloudcast-upnext-row'))
	const nowPlaying = row.findIndex(song => song.classList.contains('now-playing'))
	const children = Array.from(row[nowPlaying + 1].childNodes)
	const image = children.find(child => child.classList.contains('cloudcast-row-image'))
	if (image)
		image.click()
})

ipcRenderer.on('init', () => {
	let currentArtist = ''
	let currentTrack = ''

	setInterval(() => {
		console.log('currentTrack', currentTrack, 'currentArtist', currentArtist)

		const titleElement = document.querySelector('[class*=RebrandPlayerSliderComponent__Artist]')
		if (!titleElement) return
		const title = titleElement.innerText

		if (title !== currentArtist) {
			currentArtist = String(title)
			console.log('New Artist', currentArtist)
			ipcRenderer.send('handlePlay', currentArtist)
		}

		let trackElement = document.querySelector('[class*=RebrandPlayerSliderComponent__Track-]')
		if (!trackElement) return
		let track = document.querySelector('[class*=RebrandPlayerSliderComponent__Track-]').innerText

		if (track !== currentTrack) {
			let trackTruncated = track.replace(/[\u2014\u002d]\sbuy$/gi, '')
			trackTruncated = trackTruncated.replace('by ', '')

			currentTrack = trackTruncated
			console.log('New Track', currentTrack)

			let notificationSubtitle = 'Mixcloud Play'

			ipcRenderer.send('nowPlaying', currentTrack, title, notificationSubtitle)
		}
	}, 2000)
})

//Elements
document.addEventListener('click', function(event) {
	const playPause = document.querySelector('[class*=PlayButton__PlayerControl]')
	const eventPath = event.path || (event.composedPath && event.composedPath()) || []
	const playPauseClicked = eventPath.find(path => path === playPause)
	if (playPauseClicked) {
		console.log(playPauseClicked)
		const paused = playPauseClicked.classList.contains('dvjoTG')
		console.log(paused)
		let trackElement = document.querySelector('[class*=RebrandPlayerControls__ShowTitle]')
		if (!trackElement) return
		let track = trackElement.innerText
		console.log(track)
		ipcRenderer.send(paused ? 'handlePause' : 'handlePlay', track);
	}
	console.log(pause,play)
});