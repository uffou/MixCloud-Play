const preferencesItem = {
	label: 'Preferences...',
	accelerator: 'Command+,'
};

const dashboardItem = {
	label: 'Dashboard'
};

const template = [
	{
		label: 'MixCloud Play',
		submenu: [
			{
				label: 'About MixCloud Play',
				role: 'about'
			},
			{ type: 'separator' },
			preferencesItem,
			{ type: 'separator' },
			{
				role: 'services',
				submenu: []
			},
			{ type: 'separator' },
			{
				label: 'Hide MixCloud Play',
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
				label: 'Quit MixCloud Play',
				role: 'quit'
			}
		]
	},
	{
		role: 'editMenu'
	},
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
			{
				role: 'close'
			},
			{
				role: 'minimize'
			},
			{
				role: 'zoom'
			},
			{
				type: 'separator'
			},
			{
				role: 'front'
			}
		]
	}
];

template.setPreferencesClickHandler = (handler) => {
	preferencesItem.click = handler;
}

template.setDashboardClickHandler = (handler) => {
	dashboardItem.click = handler;
}

module.exports = template;