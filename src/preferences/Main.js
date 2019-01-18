const { remote } = window.require(`electron`);

const { observer } = require(`mobx-react`);
const React = require(`react`);

const noop = require(`../@util/noop`);

const { dialog, getCurrentWindow, app } = remote;
const settingsStore = require(`./SettingsStore`);

@observer class Main extends React.Component {
	render(){
		return <table>
			<tbody>
				<tr>
					<td>Notification sound:</td>
					<td>
						<select value={soundValue} onChange={settingsStore.onChangeShowTitle}>
							<option value={'show'}>Show song title in menu bar</option>
							<option value={'hide'}>Don't show song title in menu bar</option>
						</select>
					</td>
				</tr>
			</tbody>
		</table>;
	}
}

module.exports = Main;
