const keytar = require('keytar');
const notie = require('notie');
const postrequest = require('./postrequest');

const keystorename = 'Mixcloud-play';

const _login = async () => {
	let keys = await keytar.findCredentials(keystorename);

	if (keys[0]) {
		// call the Mixcloud login endpoint with previously stored details
		payload = new FormData();
		payload.append('email', keys[0].account);
		payload.append('password', keys[0].password);

		let response = await postrequest('/authentication/email-login/', payload);

		if (response) {
			notie.alert({type: 'success', text: `Logged in using previously stored details (${keys[0].account})`});
			setTimeout(() => window.location = '/', 2000);
		} else {
			console.error('Invalid login details');
			// login failed - so delete it from the keystore
			_deleteKeys();
			// Login form will stay for the user to re-enter correct details
		}
	}
}

const _logout = async () => {
	let response = await postrequest('/authentication/logout/', null);

	if (response) {
		_deleteKeys();

		notie.alert({type: 'success', text: 'Deleted stored logins'});
		setTimeout(() => window.location = '/', 4000);
	} else {
		notie.alert({type: 'error', text: 'Logout from Mixcloud.com failed'});
	}
}

const _addKey = async (username, password) => {
	keytar.setPassword(keystorename, username, password);
}

const _deleteKeys = async () => {
	// delete all logins from the keystore
	const logins = await keytar.findCredentials(keystorename);

	logins.forEach(async login => {
		console.log('Delected', login.account);
		try {
			await keytar.deletePassword(keystorename, login.account)
		} catch (err) {
			notie.alert({ type: 'error', text: err.message });
			return;
		}
	});
}

const keyStore = {
	Login: _login,
	Logout: _logout,
	AddKey: _addKey,
	DeleteKeys: _deleteKeys
}

module.exports = keyStore;