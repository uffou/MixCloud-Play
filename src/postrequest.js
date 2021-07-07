module.exports = async (endpoint, payload) => {
	let headeritems = {
		'X-Requested-With': 'XMLHttpRequest'
	}

	try {
		// Mixcloud server is checking for Cross-site request forgery
		// collect it to pass with the login request on behalf of the user
		const cookie = await cookieStore.get('csrftoken');

		if (cookie) {
			headeritems['X-CSRFToken'] = cookie.value; // add as a `headeritems`
		} else {
			console.log('Cookie not found');
		}
	} catch (error) {
		console.error(`Cookie store error: ${error}`);
	}

	return fetch(new Request(endpoint, {
			method: 'POST',
			headers: new Headers(headeritems),
			body: payload
		}))
		.then(function(response) {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then(function(response) {
			console.log('fetch response', response);
			return response.success;
		})
		.catch(function(error) {
			console.error('Post Request error', error.message);
		});
}