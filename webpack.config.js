const path = require('path');

const { version: electronVersion } = require(`electron/package.json`);
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
	entry: './src/blank.js',
	output: {
		path: path.join(__dirname, 'build'),
		filename: 'blank.js'
	},
	devtool: 'source-map',
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
							}]
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
	},
	plugins: [
		new CopyPlugin([
			{
				from: './src/img/',
				to: 'img/'
			},
			{ from: './src/preload.js' },
			{ from: './src/renderer.js' },
			{ from: './src/main.js' },
			{ from: './src/main.css' },
			{ from: './src/menu.js' },
			{ from: './src/index.html' },
		])
	]
}]