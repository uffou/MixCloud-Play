const { ipcRenderer } = window.require(`electron`);

const { observable, action } = require('mobx');

const SoundValues = require(`../@enum/SoundValues`);

module.exports = class Settings {
	@observable soundValue;
	@observable soundFilename;
	@observable lastSoundFileId;

	constructor(configStore){
		this.configStore = configStore;
		this.soundValue = configStore.get('soundValue');
		this.soundFilename = configStore.get('soundFilename');
		this.lastSoundFileId = configStore.get('lastSoundFileId');
	}

	@action setSound(value, filename = '', ext = ''){
		this.soundValue = value;
		this.soundFilename = filename;
		this.configStore.set({
			soundValue: value,
			soundFilename: filename,
			soundExtension: ext
		});
		ipcRenderer.send('updatedSound')
	}

	@action setLastSoundFileId(id){
		this.lastSoundFileId = id;
		this.configStore.set('lastSoundFileId', id);
	}
}