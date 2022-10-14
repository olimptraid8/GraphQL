const fetch = require('node-fetch');
var setCookie = require('set-cookie-parser');
const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../../../config.json');
const paginationFromHeader = require('../../helpers/getPagination');

class BarongAdminAPI extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = config.barongURL;
		this.internalURL = config.barongInternalURL || 'http://barong:8001/api/v2/';
	}

	getPaginationHeaders(response) {
		const result = {};
		response.headers.forEach(function(val, key) {
			switch (key) {
				case 'page':
					result.page = val;
					break;
				case 'per-page':
					result.perPage = val;
					break;
				case 'total':
					result.total = val;
					break;
				default:
					break;
			}
		});
		return result;
	}

	getUrlHeaders(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? {
					authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json'
				}
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		return { baseURL, reqHeaders };
	}

	async pending(_barong_session, params, headers) {
		let {baseURL, reqHeaders} = this.getUrlHeaders(_barong_session, headers);
		const queryData = Object.keys(params).map(el => `${el}=${params[el]}`);
		queryData.push('extended=true');
		let query = encodeURI(queryData.join('&'));

		const response = await fetch(`${baseURL}admin/users/documents/pending?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async adminListUsers(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const queryArray = Object.keys(params).map(el => `${el}=${encodeURIComponent(params[el])}`);
		queryArray.push('extended=true');
		let query = queryArray.join('&');
		const response = await fetch(`${baseURL}admin/users?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();
		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async adminPermissions(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(params).map(el => `${el}=${params[el]}`).join('&'));

		const response = await fetch(`${baseURL}admin/permissions?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async adminRestrictions(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(params).map(el => `${el}=${params[el]}`).join('&'));

		const response = await fetch(`${baseURL}admin/restrictions?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async createPermission(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/permissions`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async updatePermission(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/permissions`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async deletePermission(_barong_session, id, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/permissions?id=${id}`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async createRestriction(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/restrictions`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async updateRestriction(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/restrictions`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async deleteRestriction(_barong_session, id, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		
		const response = await fetch(`${baseURL}admin/restrictions?id=${id}`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		
		return data;
	}

	async adminUserActivities(_barong_session, params, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const queryData = Object.keys(params).map(el => `${el}=${params[el]}`);
		let query = encodeURI(queryData.join('&'));
		const reqUrl = `${baseURL}admin/activities?${query}`;
		const response = await fetch(reqUrl, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 302 && response.status !== 304) {
			
			return {errors: [response.statusText], status: response.status};
		}
		const data = await response.json();
		
		if (data.errors) {
			
			data.status = response.status;
			return data ;
		}
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async adminUser(_barong_session, userId, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqUrl = `${baseURL}admin/users/${userId}`;
		const response = await fetch(reqUrl, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		// console.log("ADMIN USER", reqUrl, baseURL, reqHeaders, response.status);
		if (response.status !== 200 && response.status !== 302 && response.status !== 304) {
			
			return {errors: [response.statusText], status: response.status};
		}
		const data = await response.json();
		
		if (data.errors) {
			
			data.status = response.status;
			return data ;
		}
		return data;
	}

	async adminUserByLabel(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users/labels?key=${reqData.key}&value=${reqData.value}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		if (response.status !== 200 && response.status !== 304) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}

	async updateUserAttributes(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return { ...data };
		}
		return data;
	}

	async updateUserRole(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users/role`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return { ...data };
		}
		return { ...data };
	}

	async updateUserProfile(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/profiles`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}

	async adminLabels(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);

		const response = await fetch(`${baseURL}admin/users/labels/list`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});

		const data = await response.json();
		console.log("DATA LABELS", data);
		if (data.errors) {
			data.status = response.status;
			return data;
		}
		const res = Object.keys(data).map(k=>{
			const key=JSON.parse(k);
			return {
				key: key[0],
				value: key[1]
			}
		});
		console.log(res);
		return  res
	}

	async adminLevels(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);

		const response = await fetch(`${baseURL}admin/users/levels`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}

	async createUserLabel(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users/labels`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data ;
		}
		return data;
	}

	async updateUserLabel(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users/labels/update`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}

	async deleteUserLabel(_barong_session, params, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const reqData = { ...params };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/users/labels`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();

		if (response.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}
}

module.exports = BarongAdminAPI;
