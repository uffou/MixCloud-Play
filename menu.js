const { app, BrowserWindow } = require('electron');
const appName = app.getName();

function sendAction(action) {
	const [win] = BrowserWindow.getAllWindows();
	if (process.platform === 'darwin') win.restore();
	win.webContents.send(action);
}

const template = [
	{
		label: appName,
		submenu: [
			{
				label: `About ${appName}`,
				role: 'about'
			},
			{
				label: 'Logout',
				click: () => sendAction('logOut')
			},
			{ type: 'separator' },
			{
				role: 'services',
				submenu: []
			},
			{ type: 'separator' },
			{
				label: `Hide ${appName}`,
				role: 'hide'
			},
			{
				label: 'Hide Others',
				accelerator: 'Cmd+Option+H',
				role: 'hideothers'
			},
			{ role: 'unhide' },
			{ type: 'separator' },
			{
				label: `Quit ${appName}`,
				accelerator: 'Cmd+Q',
				click: () => app.quit()
			}
		]
	},
	{ role: 'editMenu' },
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'toggleFullScreen' }
		]
	},
	{
		label: 'Go',
		submenu: [
			// {
			// 	label: 'Back',
			// 	accelerator: 'CmdOrCtrl+[',
			// 	click: () => sendAction('goBack')
			// },
			// {
			// 	label: 'Forward',
			// 	accelerator: 'CmdOrCtrl+]',
			// 	click: () => sendAction('goForward')
			// },
			// { type: 'separator' },
			{
				label: 'New Shows',
				click: () => sendAction('goToNewShows')
			}
		]
	},
	{
		role: 'window',
		submenu: [
			{ role: 'close' },
			{ role: 'minimize' },
			{ role: 'zoom' },
			{ type: 'separator' },
			{ role: 'front' }
		]
	}
];

module.exports = template;