const path = require('path');

const { version: electronVersion } = require(`electron/package.json`);
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
	entry: './src/preferences/renderer',
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, 'build', 'preferences'),
		filename: 'renderer.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', {
								targets: {electron: electronVersion}
							}],
							'@babel/preset-react'
						],
						plugins: [
							["@babel/plugin-proposal-decorators", { legacy: true }],
							'@babel/plugin-proposal-function-bind',
							['@babel/plugin-proposal-class-properties', { loose: true }]
						]
					}
				}
			}
		]
	}
}, {
	entry: './src/blank.js',
	output: {
		path: path.join(__dirname, 'build'),
		filename: 'blank.js'
	},
	plugins: [
		new CopyPlugin([
			{
				from: './src/img/',
				to: 'img/'
			},
			{
				from: './src/preferences/index.html',
				to: 'preferences/index.html'
			},
			{ from: './src/main.css' },
			{ from: './src/index.html' },
			{ from: './src/main.js' },
			{ from: './src/menu.js' },
			{ from: './src/preload.js' },
			{ from: './src/renderer.js' },
		])
	]
}]