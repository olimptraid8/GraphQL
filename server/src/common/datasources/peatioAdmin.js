const fetch = require('node-fetch');
var setCookie = require('set-cookie-parser');
const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../../../config.json');
const paginationFromHeader = require('../../helpers/getPagination');

class PeatioAdminAPI extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = config.peatioURL;
		this.internalURL = config.peatioInternalURL || 'http://peatio:8000/api/v2/';
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

	async blockchain(_barong_session, id, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/blockchains/${id}`, {
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
		data.enabled = data.status === 'active';
		return data;
	}

	async blockchains(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/blockchains?`, {
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

		return data.map((d) => ({ ...d, enabled: d.status === 'active' }));
	}

	async createBlockchain(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params, status: params.enabled ? 'active' : 'disabled' };
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/blockchains/new`, {
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
		data.enabled = data.status === 'active';
		return data;
	}

	async updateBlockchain(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json'
				 }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		let reqData = { ...params};
		if (!params.height) {
			reqData.status = params.enabled ? 'active' : 'disabled';
		}
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/blockchains/update`, {
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

		data.enabled = data.status === 'active';
		return data;
	}

	async blockchainClients(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/blockchains/clients?`, {
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
		return (data || []).map((c) => ({ client: c }));
	}

	async tradingFees(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/trading_fees`, {
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

	async deposit(_barong_session, tid, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;
		
		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/deposits?tid=${tid}`, {
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
		if (data.length === 0) return {};
		const d = data[0];
		d.spread = JSON.stringify(d.spread)
		console.log("ORIGINAL DEPOSIT---------------\n",d,"\n==============")
		d.currency_code = d.currency;
		delete d.currency;
		return d;
	}


	async deposits(_barong_session, params, headers) {
		let {baseURL, reqHeaders} = this.getUrlHeaders(_barong_session, headers);
		const queryData = Object.keys(params).map(el => `${el}=${params[el]}`);
		const query = encodeURI(queryData.join('&'));

		const response = await fetch(`${baseURL}admin/deposits?${query}`, {
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
		data.map(d=>{
			d.currency_code = d.currency;
			if (d.confirmations === 'N/A') {
				delete d.confirmations;
			}
			delete d.currency;
			d.spread = JSON.stringify(d.spread);
			return d});
		return {
			...this.getPaginationHeaders(response),
			result: data
		};
	}

	async walletGateways(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/wallets/gateways?`, {
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
		return (data || []).map((c) => ({ gateway: c }));
	}

	async markets(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/markets?`, {
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

		return data.map((d) => ({ ...d, enabled: d.state === 'enabled' }));
	}

	async market(_barong_session, id, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/markets/${id}`, {
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
		data.enabled = data.state === 'enabled';
		return data;
	}

	async createMarket(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const reqData = { ...params, 
			state: params.enabled ? 'enabled' : 'disabled',
			position: parseInt(params.position) ,
			amount_precision: parseInt(params.amount_precision),
			price_precision: parseInt(params.price_precision),
			max_price: params.max_price ? params.max_price.toString(): "0.0",
			min_amount: params.min_amount ? params.min_amount.toString(): "0.0",
			min_price: params.min_price ? params.min_price.toString(): "0.0"
		};
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/markets/new`, {
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

	async updateMarket(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params, 
			state: params.enabled ? 'enabled' : 'disabled',
			max_price: params.max_price? params.max_price.toString(): "0.0",
			min_amount: params.min_amount? params.min_amount.toString(): "0.0",
			min_price: params.min_price? params.min_price.toString(): "0.0"
		};
		
		delete reqData._barong_session;
		
		const response = await fetch(`${baseURL}admin/markets/update`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		const data = await response.json();
		console.log(data);
		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return data;
	}

	async currencies(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/currencies?`, {
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

		return data.map((d) => ({
			...d,
			options: d.options ? Object.keys(d.options).map(key => {return {key, value: d.options[key]}}) : []
		}));
	}

	async currency(_barong_session, code, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqUrl = `${baseURL}admin/currencies/${code}`;
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
			return data;
		}
		data.options = Object.entries(data.options || []).map(([ key, value ]) => ({ key, value }));
		return data;
	}

	async createCurrency(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params,
			min_collection_amount: params.min_collection_amount ? params.min_collection_amount.toString(): "0.0",
			min_deposit_amount: params.min_deposit_amount ? params.min_deposit_amount.toString(): "0.0",
			min_withdraw_amount: params.min_withdraw_amount ? params.min_withdraw_amount.toString(): "0.0",
			withdraw_fee: params.withdraw_fee ? params.withdraw_fee.toString(): "0.0",
			withdraw_limit_24h: params.withdraw_limit_24h ? params.withdraw_limit_24h.toString(): "0.0",
			withdraw_limit_72h: params.withdraw_limit_72h ? params.withdraw_limit_72h.toString(): "0.0",
		};
		delete reqData._barong_session;
		const options = JSON.parse(params.options)|| [];
		delete reqData.options;

		reqData.options = options.reduce((ret, o) => {
			ret[o.key] = o.value;
			return ret;
		}, {});

		const response = await fetch(`${baseURL}admin/currencies/new`, {
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
		data.options = Object.entries(data.options).map(([ key, value ]) => ({ key, value }));
		return data;
	}

	async updateCurrency(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params,
			min_collection_amount: params.min_collection_amount ? params.min_collection_amount.toString(): "0.0",
			min_deposit_amount: params.min_deposit_amount ? params.min_deposit_amount.toString(): "0.0",
			min_withdraw_amount: params.min_withdraw_amount ? params.min_withdraw_amount.toString(): "0.0",
			deposit_fee: params.deposit_fee ? params.deposit_fee.toString(): "0.0",
			withdraw_fee: params.withdraw_fee ? params.withdraw_fee.toString(): "0.0",
			withdraw_limit_24h: params.withdraw_limit_24h ? params.withdraw_limit_24h.toString(): "0.0",
			withdraw_limit_72h: params.withdraw_limit_72h ? params.withdraw_limit_72h.toString(): "0.0",
		};
		delete reqData._barong_session;
		const options = JSON.parse(params.options);
		delete reqData.options;
		reqData.options = (options || []).reduce((ret, o) => {
			ret[o.key] = o.value;
			return ret;
		}, {});

		const response = await fetch(`${baseURL}admin/currencies/update`, {
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
		data.options = Object.entries(data.options || []).map(([ key, value ]) => ({ key, value }));
		return data;
	}
	

	async createTradingFee(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params,
			taker: params.taker?params.taker.toString():"0.0",
			maker: params.maker?params.maker.toString():"0.0",
		};
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/trading_fees/new`, {
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

	async updateTradingFee(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params,
			taker: params.taker?params.taker.toString():"0.0",
			maker: params.maker?params.maker.toString():"0.0",
		};
		delete reqData._barong_session;

		const response = await fetch(`${baseURL}admin/trading_fees/update`, {
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

	async adjustments(_barong_session, reqData, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));

		const response = await fetch(`${baseURL}admin/adjustments?${query}`, {
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
			result: data.map(el => {
				const res = {...el, currency_code: el.currency};
				if (res.liability) {
					res.liability = {...res.liability, currency_code: res.liability.currency};
				}
				if (res.asset) {
					res.asset = {...res.asset, currency_code: res.asset.currency};
				}
				if (res.revenue) {
					res.revenue = {...res.revenue, currency_code: res.revenue.currency};
				}
				if (res.expense) {
					res.expense = {...res.expense, currency_code: res.expense.currency};
				}
				delete res.currency;
				return res;
			})
		}
	}

	async adjustment(_barong_session, id, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const response = await fetch(`${baseURL}admin/adjustments/${id}`, {
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
		const res = {...data, currency_code: data.currency};
		if (res.liability) {
			res.liability = {...res.liability, currency_code: res.liability.currency};
		}
		if (res.asset) {
			res.asset = {...res.asset, currency_code: res.asset.currency};
		}
		if (res.revenue) {
			res.revenue = {...res.revenue, currency_code: res.revenue.currency};
		}
		if (res.expense) {
			res.expense = {...res.expense, currency_code: res.expense.currency};
		}
		delete res.currency;
		return res;
	}

	async createAdjustment(_barong_session, reqData, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const response = await fetch(`${baseURL}admin/adjustments/new`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(reqData)
		});

		if (response.status !== 201) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		const res = {...data, currency_code: data.currency};
		if (res.liability) {
			res.liability = {...res.liability, currency_code: res.liability.currency};
		}
		if (res.asset) {
			res.asset = {...res.asset, currency_code: res.asset.currency};
		}
		if (res.revenue) {
			res.revenue = {...res.revenue, currency_code: res.revenue.currency};
		}
		if (res.expense) {
			res.expense = {...res.expense, currency_code: res.expense.currency};
		}
		delete res.currency;
		return res;
	}

	async actionAdjustment(_barong_session, id, action, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const response = await fetch(`${baseURL}admin/adjustments/action`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				id, action
			})
		});

		if (response.status !== 201) {
			return {errors: [response.statusText], status: response.status};
		}

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		const res = {...data, currency_code: data.currency};
		if (res.liability) {
			res.liability = {...res.liability, currency_code: res.liability.currency};
		}
		if (res.asset) {
			res.asset = {...res.asset, currency_code: res.asset.currency};
		}
		if (res.revenue) {
			res.revenue = {...res.revenue, currency_code: res.revenue.currency};
		}
		if (res.expense) {
			res.expense = {...res.expense, currency_code: res.expense.currency};
		}
		delete res.currency;
		return res;
	}
	

	async wallets(_barong_session, reqData, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/wallets?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		console.log('WALLETS*****API*', response, response.status, response.statusText);

		const data = await response.json();

		if (data.errors) {
			data.status = response.status;
			return data;
		}
		return {
			...this.getPaginationHeaders(response),
			result: data.map((w) => {
				w.currency_code = w.currency;
				delete w.currency;
				w.enabled = w.status === 'active';
				return w;
			})
		}
	}

	async wallet(_barong_session, id, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};

		const response = await fetch(`${baseURL}admin/wallets/${id}`, {
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
		data.currency_code = data.currency;
		delete data.currency;
		data.enabled = data.status === 'active';

		return data;
	}

	async createWallet(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params, 
			status: params.enabled ? 'active' : 'disabled', 
			max_balance: params.max_balance? params.max_balance.toString(): "0.0" 
		};
		delete reqData._barong_session;
		const { settings } = params;
		delete reqData.settings;
		const o = JSON.parse(settings);
		reqData.settings = o;

		const response = await fetch(`${baseURL}admin/wallets/new`, {
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

	async updateWallet(params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${params._barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const { settings } = params;
		let reqData = {...params};
		delete reqData._barong_session;
		if (settings) {
			delete reqData.settings;
			const o = JSON.parse(settings);
			reqData.settings = o;
		} else {
			reqData = { ...params, 
				status: params.enabled ? 'active' : 'disabled',
				max_balance: params.max_balance? params.max_balance.toString(): "0.0"  
			};	
		}

		const response = await fetch(`${baseURL}admin/wallets/update`, {
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

	async createDeposit(_barong_session, params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params };
		delete reqData._barong_session;
		reqData.amount = String(reqData.amount);
		const response = await fetch(`${baseURL}admin/deposits/new`, {
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
		const result = {...data, currency_code: data.currency};
		delete result.currency;
		//console.log(result);
		return result;
	}

	async actionDeposit(_barong_session, params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const reqData = { ...params };
		delete reqData._barong_session;
		const response = await fetch(`${baseURL}admin/deposits/actions`, {
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
		const result = {...data, currency_code: data.currency};
		delete result.currency;
		return result;
	}

	async withdraws(_barong_session, params, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		let query = Object.keys(params).map(el => {
			if (el === 'state') {
				return params.state.map(st => `state[]=${st}`).join('&');
			} else {
				return `${el}=${params[el]}`
			}
		}).join('&');

		const response = await fetch(`${baseURL}admin/withdraws?${query}`, {
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
			result: data.map(el => {
				const res = {...el, currency_code: el.currency};
				delete res.currency;
				if (typeof res.block_number === 'string') {
					res.block_number = 0;
				}
				return res;
			})
		};
	}

	async withdraw(_barong_session, id, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const response = await fetch(`${baseURL}admin/withdraws/${id}`, {
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
		} else {
			if (data.block_number && (typeof data.block_number === 'string')) {
				data.block_number = 0;
			}
			if (data.confirmations && (typeof data.confirmations === 'string')) {
				data.confirmations = 0;
			}
		}
		const res = {...data, currency_code: data.currency};
		delete res.currency;
		return res;
	}

	async actionWithdraw(_barong_session, id, action, txid, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization,
					'Access-Control-Allow-Credentials': true,
					'content-type': 'application/json' }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`,
						'Access-Control-Allow-Credentials': true
					};
		const response = await fetch(`${baseURL}admin/withdraws/actions`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				id, action, txid
			})
		});

		if (response.status !== 201) {
			return {errors: [response.statusText], status: response.status};
		}
		
		return {};
	}

	async assets(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/assets?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result: result.map(el => {
				const data = {
					...el,
					currency_code: el.currency
				}
				delete data.currency;
				return data;
			})
		}
	}

	async expenses(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/expenses?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result: result.map(el => {
				const data = {
					...el,
					currency_code: el.currency
				}
				delete data.currency;
				return data;
			})
		}
	}

	async revenues(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/revenues?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result: result.map(el => {
				const data = {
					...el,
					currency_code: el.currency
				}
				delete data.currency;
				return data;
			})
		}
	}

	async liabilities(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/liabilities?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result: result.map(el => {
				const data = {
					...el,
					currency_code: el.currency
				}
				delete data.currency;
				return data;
			})
		}
	}

	async adminCancelOrder(_barong_session, id, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}admin/orders/${id}/cancel`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});

		if (response.status !== 201) {
			return {errors: [response.statusText], status: response.status};
		}
		return {data: 'done'};
	}

	async adminOrders(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/orders?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result
		}
	}

	async adminTrades(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/trades?${query}`, {
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
		const result = await response.json();
		return {
			...this.getPaginationHeaders(response),
			result
		};
	}

	async adminMembers(_barong_session, reqData, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		let query = encodeURI(Object.keys(reqData).map(el => `${el}=${reqData[el]}`).join('&'));
		const response = await fetch(`${baseURL}admin/members?${query}`, {
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
		const result = await response.json();
		return result.map(member => {
			return {
				...member,
				accounts: member.accounts.map(a => ({...a, currency_code: a.currency}))
			};
		});
	}

	async adminMember(_barong_session, uid, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}admin/members/${uid}`, {
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
		const member = await response.json();
		return {
			...member,
			accounts: member.accounts.map(a => ({...a, currency_code: a.currency}))
		};
	}

	async setUserGroup(_barong_session, uid, group, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}admin/members/${uid}`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({group})
		});

		if (response.status !== 201) {
			return {errors: [response.statusText], status: response.status};
		}
		const member = await response.json();
		return {
			...member,
			accounts: member.accounts.map(a => ({...a, currency_code: a.currency}))
		};
	}

	async availableGroup(_barong_session, headers) {
		const { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}admin/members/groups`, {
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
		const groups = await response.json();
		return groups.map(el => ({group: el}));
	}
}

module.exports = PeatioAdminAPI;
