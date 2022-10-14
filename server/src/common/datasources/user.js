const fetch = require('node-fetch');
var setCookie = require('set-cookie-parser');
const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../../../config.json');
const paginationFromHeader = require('../../helpers/getPagination');

class UserAPI extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = config.barongURL;
		this.baseInternalURL = config.barongInternalURL || 'http://barong:8001/api/v2/';
	}

	async login({ email, password, otp_code }) {
		const response = await fetch(`${this.baseURL}identity/sessions`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
				'User-Agent': 'Exchange/proxy'
			},
			body: JSON.stringify({
				email,
				password,
				otp_code
			})
		});
		// console.log('LOGIN ', {
		// 	'Content-Type': 'application/json;charset=utf-8',
		// 	'User-Agent': 'Exchange/proxy'
		// })
		const data = await response.json();
		var combinedCookieHeader = response.headers.get('Set-Cookie');
		var splitCookieHeaders = setCookie.splitCookiesString(combinedCookieHeader);
		var cookies = setCookie.parse(splitCookieHeaders, { map: true });
		if (data.errors) {
			return { ...data, status: response.status };
		}
		return {
			...data,
			_barong_session: cookies['_barong_session'] ? cookies['_barong_session'].value : null,
			_barong_session_expires: cookies['_barong_session'] ? cookies['_barong_session'].expires.getTime() : null
		};
	}

	async logout(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.baseInternalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}identity/sessions`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const data = await response.json();
		if (data.errors) {
			return { ...data, status: response.status };
		}
		return data;
	}

	async getUserData(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.baseInternalURL : this.baseURL;
		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		// console.log('GET USER DATA', _barong_session, reqHeaders)
		const response = await fetch(`${baseURL}resource/users/me`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const data = await response.json();

		if (data.errors) {
			return { ...data, status: response.status };
		}
		if (data.profiles && data.profiles.length > 0) {
			data.profile = data.profiles[0];
		}
		return { ...data };
	}

	// async getActivityHistory(params) {
	// 	const query = `?page=${params.page || 1}&limit=${params.limit || 1}`;
	// 	const response = await fetch(`${this.baseURL}resource/users/activity/${params.topic.toLowerCase()}${query}`, {
	// 		method: 'GET',
	// 		mode: 'cors',
	// 		cache: 'no-cache',
	// 		redirect: 'follow',
	// 		referrer: 'no-referrer',
	// 		headers: {
	// 			'Content-Type': 'application/json;charset=utf-8',
	// 			'User-Agent': 'Exchange/proxy',
	// 			Cookie: `_barong_session=${params._barong_session}`
	// 		},
	// 		timeout: 0
	// 	});
	// 	const res = await response.json();
	// 	if (response.status === 200) {
	// 		const pagination = paginationFromHeader(response.headers);
	// 		return {
	// 			activities: res.map((el) => {
	// 				return {
	// 					...el,
	// 					created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at
	// 				};
	// 			}),
	// 			page: pagination.page,
	// 			total: pagination.total,
	// 			perPage: pagination.perPage
	// 		};
	// 	}
	// 	return { ...res, status: response.status };
	// }
	async getActivityHistory(params) {
		const query = `?page=${params.page || 1}&limit=${params.limit || 25}`;
		const response = await fetch(`${this.baseURL}resource/users/activity/${params.topic.toLowerCase()}${query}`, {
		  method: 'GET',
		  mode: 'cors',
		  cache: 'no-cache',
		  redirect: 'follow',
		  referrer: 'no-referrer',
		  headers: {
			'Content-Type': 'application/json;charset=utf-8',
			'User-Agent': 'Exchange/proxy',
			'Cookie': `_barong_session=${params._barong_session}`
		  },
		  timeout: 0
		});
		const res = await response.json();
		if (response.status !== 200 && response.status !== 304) {
		  return {...res, status: response.status};
		}
		const pagination = paginationFromHeader(response.headers);
		return {
		  activities: res.map(el => {
			return {
			  ...el,
			  created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at,
			};
		  }),
		  page: pagination.page, total: pagination.total, perPage: pagination.perPage
		}
	}
}

module.exports = UserAPI;
