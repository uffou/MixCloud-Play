const fs = window.require('fs');
const path = window.require('path');

const { remote } = window.require(`electron`);

const PropTypes = require(`prop-types`);
const { observer } = require(`mobx-react`);
const React = require(`react`);

const SoundValues = require(`../@enum/SoundValues`);

const noop = require(`../@util/noop`);

const Deferred = require(`./Deferred`);

const { dialog, getCurrentWindow, app } = remote;

function unsupportedFileTypeErrorDialog(){
	dialog.showMessageBox(getCurrentWindow(), {
		type: "error",
		message: "The selected file cannot be used.",
		title: "Unsupported file type"
	})
}

const openFileDialogOptions = {
	properties: ["openFile"]
}

const longAudioFileDialogOptions = {
	type: "question",
	buttons: ['Cancel', 'OK'],
	title: "Long audio file",
	message: "This audio file is longer than 5 seconds. Are you sure you want to use this for a notification sound?"
};

@observer class Main extends React.Component {
	static propTypes = {
		settings: PropTypes.shape({
			soundValue: PropTypes.oneOf(Object.values(SoundValues)).isRequired,
			soundFilename: PropTypes.string.isRequired,
			lastSoundFileId: PropTypes.number.isRequired,
			setSound: PropTypes.func.isRequired,
			setLastSoundFileId: PropTypes.func.isRequired
		}).isRequired
	}

	fileInputRef = React.createRef();

	handleSoundChange = ::this.handleSoundChange;
	handleSoundChange({target}){
		const { settings } = this.props;
		const { value } = target;
		if(value !== SoundValues.CUSTOM){
			settings.setSound(value);

			return;
		}

		dialog.showOpenDialog(getCurrentWindow(), openFileDialogOptions, ([file] = []) => {
			if(!file) return;

			const audio = new Audio(file);
			const loadedDataDefferer = new Deferred();
			const longAudioAnswerDeferrer = new Deferred();

			Promise.all([
				loadedDataDefferer.promise,
				longAudioAnswerDeferrer.promise
			]).then(() => {
				const { base: filename, ext } = path.parse(file);
				const appDataPath = app.getPath('userData');
				const nextFileId = settings.lastSoundFileId + 1;
				settings.setLastSoundFileId(nextFileId);
				const destinationFolder = path.join(appDataPath, `soundFiles`);
				const copyFile = () => {
					const destinationFilename = `${nextFileId}${ext}`;
					fs.copyFile(file, path.join(destinationFolder, destinationFilename), (error) => {
						if(error){
							dialog.showMessageBox(getCurrentWindow(), {
								type: "error",
								message: "The selected file cannot be used.",
								title: "Unsupported file type"
							})

							return;
						}

						fs.readdir(destinationFolder, (error, files) => {
							if(error) return;

							for(const file of files){
								if(file === destinationFilename) continue;
								fs.unlink(path.join(destinationFolder, file), noop);
							}
						})

						settings.setSound(SoundValues.FILE, filename, ext)
					})
				}
				fs.exists(destinationFolder, (exists) => {
					if(exists){
						copyFile();
					}else{
						fs.mkdir(destinationFolder, copyFile)
					}
				})
			}).catch(noop)

			const handleLoadedData = () => {
				if(audio.error){
					unsupportedFileTypeErrorDialog();
					loadedDataDefferer.reject();
					return;
				}

				loadedDataDefferer.resolve();
			}

			audio.addEventListener('loadedmetadata', () => {
				// TODO: audio.canPlayType()
				if(audio.error){
					unsupportedFileTypeErrorDialog();

					audio.removeEventListener('loadeddata', handleLoadedData);
					loadedDataDefferer.reject();
					return;
				}

				if(audio.duration > 5){
					dialog.showMessageBox(getCurrentWindow(), longAudioFileDialogOptions, (response) => {
						if(response === 1){
							longAudioAnswerDeferrer.resolve();
						}else{
							longAudioAnswerDeferrer.reject();
						}
					})
				}else{
					longAudioAnswerDeferrer.resolve();
				}
			})

			audio.addEventListener('loadeddata', handleLoadedData);

			audio.addEventListener('error', () => {
				unsupportedFileTypeErrorDialog();
				loadedDataDefferer.reject();
				longAudioAnswerDeferrer.reject();
			})
		});
	}

	render(){
		const { soundValue, soundFilename } = this.props.settings;
		return <table>
			<tbody>
				<tr>
					<td>Notification sound:</td>
					<td>
						<select value={soundValue} onChange={this.handleSoundChange}>
							<option value={SoundValues.HELP_SCOUT}>Default Help Scout sound</option>
							<option value={SoundValues.OPERATING_SYSTEM}>Default OS sound</option>
							{soundFilename && <option value={SoundValues.FILE}>{soundFilename}</option>}
							<option value={SoundValues.CUSTOM}>Custom...</option>
							<option value={SoundValues.NO_SOUND}>No sound</option>
						</select>
					</td>
				</tr>
			</tbody>
		</table>;
	}
}

module.exports = Main;
