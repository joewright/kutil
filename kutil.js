const request = require('request');

exports.kaltura = {
	sessionStart: 'https://www.kaltura.com/api_v3/service/session/action/start',
	mediaList: 'https://www.kaltura.com/api_v3/service/media/action/list',
	flavorAssetList: 'https://www.kaltura.com/api_v3/service/flavorasset/action/list',
	flavorAssetGet: 'https://www.kaltura.com/api_v3/service/flavorasset/action/get',
	flavorAssetDelete: 'https://www.kaltura.com/api_v3/service/flavorasset/action/delete'
};

/**
 * Make an HTTP request with the request library and JS Promises
 * @param  {string} url
 * @param  {request.options} options options info to pass to the request() call
 * @return {Promise<request.Response>} resolves the http response
 */
exports.makeRequest = function(url, options) {
	return new Promise((resolve, reject) => {
		request(url, options, (err, res) => {
			if (err) {
				return reject(err);
			}
			resolve(res);
		});
	});
};