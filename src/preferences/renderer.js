const { ipcRenderer } = window.require(`electron`)
const ConfigStore = window.require(`electron-store`);

const React = require('react');
const ReactDOM = require('react-dom');

const Main = require('./Main');
const Settings = require(`./Settings`);

const configStore = new ConfigStore({
	defaults: require(`../@util/configStoreDefaults`)
});

const settings = new Settings(configStore)

ipcRenderer.on('reload', () => {
	location.reload();
})

const root = document.getElementById('root');

ReactDOM.render(<Main settings={settings} />, root);
