const path = require(`path`);

const { ipcRenderer, webFrame, remote } = require(`electron`);
const ConfigStore = require(`electron-store`);

const SoundValues = require(`./@enum/SoundValues`);

const configStoreDefaults = require(`./@util/configStoreDefaults`);

// #region Custom styles
const style = document.createElement('style');
style.innerText = `
	.header{
		-webkit-app-region: drag;
	}
	.ad-header-container{
		display: none;
	}
	.header .logo{
		margin-left: 36px;
	}

	.container-wide .sidebar-small nav{
		margin-left: 36px;
		-webkit-app-region: drag;
	}
`;

const mutationObserverConfig = { childList: true };

function createObserverCallback(tagName, callback){
	return function(records){
		for(const record of records){
			for(const node of record.addedNodes){
				if(node.tagName === tagName){
					callback();
				}
			}
		}
	}
}

const pusher = document.createElement('div');
pusher.className = 'headerPusher';
const secondHeader = document.createElement('div');
secondHeader.id = 'secondHeader';

let bodyObserver;
const bodyObserverCallback = createObserverCallback('BODY', () => {
	const header = document.getElementById('header');
	header.parentNode.insertBefore(secondHeader, header);
	header.parentNode.insertBefore(pusher, header.nextSibling);
	console.log('change')
	bodyObserver.disconnect();
})
bodyObserver = new MutationObserver(bodyObserverCallback)

let headObserver;
const headObserverCallback = createObserverCallback('HEAD', () => {
	document.head.appendChild(style);
	headObserver.disconnect();
})
headObserver = new MutationObserver(headObserverCallback)

let documentObserver;
const documentObserverCallback = createObserverCallback('HTML', () => {
	headObserver.observe(document.documentElement, mutationObserverConfig)
	bodyObserver.observe(document.documentElement, mutationObserverConfig)
	documentObserver.disconnect();
})
documentObserver = new MutationObserver(documentObserverCallback)
documentObserver.observe(document, mutationObserverConfig)
// #endregion

// #region Notification
const notifications = [];
const NotificationOriginal = Notification;
function NotificationDecorated(title){
	const notification = {
		_handleClick: [],
		close(){},
		addEventListener(type, callback){
			if(type !== `click`) return;

			this._handleClick.push(callback);
		},
		click(){
			for(const callback of this._handleClick){
				callback.call(this);
			}
		}
	}

	ipcRenderer.send('notification', notifications.push(notification) - 1, title);
	return notification;
}

//Elements

document.addEventListener('click', function(event) {
	const playPause = document.getElementsByClassName('player-control')[0]
	const eventPath = event.path || (event.composedPath && event.composedPath()) || []
	const playPauseClicked = eventPath.find(path => path === playPause)
	if(playPauseClicked){
		console.log(playPauseClicked)
		const paused = playPauseClicked.classList.contains('pause-state')
		console.log(paused)
		let track = document.getElementsByClassName('player-current-audio')[0].innerText
		if(track.includes('  — Buy')) track = track.replace('  — Buy','')
		if(track.includes('by')) track = track.replace('by',' by')
		console.log(track)
		ipcRenderer.send(paused ? 'handlePause' : 'handlePlay', track);
	}
	// console.log(pause,play)
});

ipcRenderer.on('notificationClicked', (_, notificationIndex) => {
	const originalOpen = window.open;
	window.open = (url) => {
		window.location = url;
	}
	notifications[notificationIndex].click();
	// window.open = originalOpen;
})

ipcRenderer.on('playPause', () => {
	const playPause = document.getElementsByClassName('player-control')[0]
	console.log('in here')
	playPause.click()
})

ipcRenderer.on('next', () => {
	const row = Array.from(document.getElementsByClassName('cloudcast-upnext-row'))
	const nowPlaying = row.findIndex(song => song.classList.contains('now-playing'))
	const children = Array.from(row[nowPlaying + 1].childNodes)
	const image = children.find(child => child.classList.contains('cloudcast-row-image'))
	image.click()
})

ipcRenderer.on('init', () => {
	let nowPlaying = ''
	let currentTrack = ''
	setInterval(()=>{
		const elements = document.getElementsByClassName('player-cloudcast-title')
		if(!elements && !elements.length) return
		const title = elements[0].innerText;
		if(title !== nowPlaying){
			nowPlaying = String(title)
			console.log(nowPlaying)
			ipcRenderer.send('handlePlay', nowPlaying)
		}

		let track = document.getElementsByClassName('player-current-audio')[0].innerText
		if(currentTrack !== track){
			currentTrack = String(track)
			console.log(currentTrack)
			let trackTruncated = String(track)
			if(trackTruncated.includes('  — Buy')) trackTruncated = trackTruncated.replace('  — Buy','')
			if(trackTruncated.includes('by')) trackTruncated = trackTruncated.replace('by',' by')
			ipcRenderer.send('nowPlaying', trackTruncated)
		}
	},2000)
})



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

const configStore = new ConfigStore({defaults: configStoreDefaults});
const AudioOriginal = Audio;
const beaconNotificationRegex = /beacon-notification\.(?:.*)$/;
function changeSound(){
	window.Audio = AudioOriginal;
	const soundValue = configStore.get('soundValue');
	const soundExtension = configStore.get('soundExtension');
	const lastSoundFileId = configStore.get('lastSoundFileId');

	switch(soundValue){
		case SoundValues.OPERATING_SYSTEM:
		case SoundValues.NO_SOUND:
			window.Audio = function(filePath){
				if(beaconNotificationRegex.test(filePath)){
					return {play(){}};
				}

				return new AudioOriginal(filePath);
			}
			break;
		case SoundValues.FILE:
			const appDataPath = remote.app.getPath('userData');
			const destinationPath = path.join(appDataPath, 'soundFiles', `${lastSoundFileId}${soundExtension}`)
			const notificationSound = new AudioOriginal(`file://${destinationPath}`);
			window.Audio = function(filePath){
				if(beaconNotificationRegex.test(filePath)){
					return notificationSound;
				}

				return new AudioOriginal(filePath);
			}
			break;
	}
}
ipcRenderer.on('updatedSound', changeSound);
changeSound();
// #endregion
