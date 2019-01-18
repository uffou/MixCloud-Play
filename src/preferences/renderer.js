const { ipcRenderer } = window.require(`electron`)
const ConfigStore = window.require(`electron-store`);

const React = require('react');
const ReactDOM = require('react-dom');

const Main = require('./Main');

ipcRenderer.on('reload', () => {
	location.reload();
})

const root = document.getElementById('root');

ReactDOM.render(<Main />, root);
