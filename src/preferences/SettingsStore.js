const { ipcRenderer } = window.require(`electron`);

const { observable, action } = require('mobx');

class SettingsStore {
	@observable showTitle;

	@action onChangeShowTitle({target}){
		this.showTitle = target.value;
		ipcRenderer.send('updatedPreferences',this)
	}
}

const settingsStore = new SettingsStore()
module.exports = settingsStore