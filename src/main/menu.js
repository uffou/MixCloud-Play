const dashboardItem = {
	label: 'Dashboard'
};

const template = [
	{
		label: 'Mixcloud Play',
		submenu: [
			{
				label: 'About Mixcloud Play',
				role: 'about'
			},
			{ type: 'separator' },
			{
				role: 'services',
				submenu: []
			},
			{ type: 'separator' },
			{
				label: 'Hide Mixcloud Play',
				role: 'hide'
			},
			{
				label: 'Hide Others',
				accelerator: 'Command+Option+H',
				role: 'hideAll'
			},
			{ role: 'unhide' },
			{ type: 'separator' },
			{
				label: 'Quit Mixcloud Play',
				role: 'quit'
			}
		]
	},
	{ role: 'editMenu' },
	{
		label: 'View',
		submenu: [
			{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click(_, window){
					window.webContents.send('reload')
				}
			},
			{ role: 'forceReload' },
			// { type: 'separator' },
			// { role: 'resetZoom' },
			// { role: 'zoomIn' },
			// { role: 'zoomOut' }
			{ type: 'separator' },
			{ role: 'toggleFullScreen' },
		]
	},
	{
		label: 'Go',
		submenu: [
			{
				label: 'Back',
				accelerator: 'CmdOrCtrl+[',
				click(_, window){
					window.webContents.send('goBack')
				}
			},
			{
				label: 'Forward',
				accelerator: 'CmdOrCtrl+]',
				click(_, window){
					window.webContents.send('goForward')
				}
			},
			{ type: 'separator' },
			dashboardItem
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

template.setDashboardClickHandler = (handler) => {
	dashboardItem.click = handler;
}

module.exports = template;