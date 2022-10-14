const fetch = require('node-fetch');
const { RESTDataSource } = require('apollo-datasource-rest');
const config = require('../../../config.json');
const paginationFromHeader = require('../../helpers/getPagination');
const orderbookSerializer = require('../../serializers/orderbookSerializer');

class PeatioAPI extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = config.peatioURL;
		this.internalURL = config.peatioInternalURL || 'http://peatio:8000/api/v2/';
	}

	async getAllCurrencies() {
		let baseURL = this.internalURL;

		const response = await fetch(`${baseURL}public/currencies`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return result;
	}

	async getCurrency(code) {
		let baseURL = this.internalURL;

		const response = await fetch(`${baseURL}public/currencies/${code}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return result;
	}

	async depth(market) {
		let baseURL = this.internalURL;

		const response = await fetch(`${baseURL}public/markets/${market}/depth`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return {
			asks: result.asks.map(el => ({price: el[0], amount: el[1]})),
			bids: result.bids.map(el => ({price: el[0], amount: el[1]}))
		};
	}

	async getAllMarkets() {
		let baseURL = this.internalURL;
	
		const response = await fetch(`${baseURL}public/markets`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return result;
	}

	async getAllMarketTickers() {
		let baseURL = this.internalURL;
		const response = await fetch(`${baseURL}public/markets/tickers`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return result;
	}

	async getMarketTicker(market) {
		let baseURL = this.internalURL;
		const response = await fetch(`${baseURL}public/markets/${market}/tickers`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return {
			...result,
			last: result.last || 0,
			price_change_percent: result.price_change_percent || 0,
			volume: result.volume || 0
		};
	}

	async getTrades(market) {
		let baseURL = this.internalURL;
		///api/v2/peatio/public/markets/ethusd/trades
		const response = await fetch(`${baseURL}public/markets/${market}/trades`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer'
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: result.status };
		}
		return result.map(trade => {
			return {
				...trade,
				side: trade.taker_type
			}
		});
	}

	async getKLine(market, period, time_from, time_to) {
		const response = this.get(
			`public/markets/${market}/k-line?period=${period}&time_from=${time_from}&time_to=${time_to}`
		);
		if (response.errors) {
			return { ...response, status: response.status };
		}
		return response;
	}

	async getBalances(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};

		const response = await fetch(`${baseURL}account/balances`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async getUserOrders(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		delete params['_barong_session'];
		var esc = encodeURIComponent;
		var query = Object.keys(params)
			.reduce((memo, k) => {
				if (params[k]) {
					memo.push(esc(k) + '=' + esc(params[k]));
				}
				return memo;
			}, [])
			.join('&');
		console.log('USER ORDER', reqHeaders);
		const response = await fetch(`${baseURL}market/orders${query ? '?' + query : ''}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async getUserTrades(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};

		delete params['_barong_session'];
		var esc = encodeURIComponent;
		var query = Object.keys(params)
			.reduce((memo, k) => {
				if (params[k]) {
					memo.push(esc(k) + '=' + esc(params[k]));
				}
				return memo;
			}, [])
			.join('&');
		const response = await fetch(`${baseURL}market/trades${query ? '?' + query : ''}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async createOrder(params, headers) {
		const body = { ...params };
		delete body._barong_session;
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		body.price = String(body.price);
		body.volume = String(body.volume);
		if (body.price && body.ord_type === 'market') {
			delete body.price;
		}
		
		const response = await fetch(`${baseURL}market/orders`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(body)
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return {
			...result,
			created_at: new Date(result.created_at).getTime() / 1000,
			updated_at: result.updated_at ? new Date(result.updated_at).getTime() / 1000 : result.updated_at
		};
	}

	async cancelOrder(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};

		const response = await fetch(`${baseURL}market/orders/${params.order_id}/cancel`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ id: params.order_id })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return {
			...result,
			created_at: new Date(result.created_at).getTime() / 1000,
			updated_at: result.updated_at ? new Date(result.updated_at).getTime() / 1000 : result.updated_at
		};
	}

	async cancelAllOrders(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}market/orders/cancel`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result.map((order) => {
			return {
				...order,
				created_at: new Date(result.created_at).getTime() / 1000,
				updated_at: result.updated_at ? new Date(result.updated_at).getTime() / 1000 : result.updated_at
			};
		});
	}

	async getDepositAddress(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}account/deposit_address/${params.currency}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async addBeneficiary(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}account/beneficiaries`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async deleteBeneficiary(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}account/beneficiaries/${params.id}`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		if (response.status < 400) {
			return {};
		}
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async activateBeneficiary(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}account/beneficiaries/${params.id}/activate`, {
			method: 'PATCH',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return { ...result, address: result.data.address };
	}

	async getBeneficiaries(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const response = await fetch(`${baseURL}account/beneficiaries`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async createWithdrawal(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;
		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		params.amount = String(params.amount);
		const response = await fetch(`${baseURL}/account/withdraws`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(params)
		});
		const result = await response.json();
		if (result.errors) {
			if (Array.isArray(result.errors)) {
				return { ...result, status: response.status };
			}
			return { errors: [ result.errors.toString() ], status: response.status };
		}
		return {
			...result,
			amount: Number(params.amount),
			fee: Number(params.fee),
			created_at: result.created_at ? new Date(result.created_at).getTime() / 1000 : null,
			updated_at: result.updated_at ? new Date(result.updated_at).getTime() / 1000 : null,
			done_at: result.done_at ? new Date(result.done_at).getTime() / 1000 : null
		};
	}

	async getDepositHistory(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const query = Object.keys(params)
			.reduce((memo, el) => {
				if (el !== '_barong_session' && params[el]) {
					memo.push(`${el}=${encodeURIComponent(params[el])}`);
				}
				return memo;
			}, [])
			.join('&');
		const response = await fetch(`${baseURL}account/deposits/?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const res = await response.json();
		if (response.status === 200) {
			const result = {
				deposits: res.map((el) => {
					return {
						...el,
						created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at,
						completed_at: el.completed_at ? new Date(el.completed_at).getTime() / 1000 : el.completed_at
					};
				})
			};
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
		return { ...res, status: response.status };
	}

	async getWithdrawHistory(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const query = Object.keys(params)
			.reduce((memo, el) => {
				if (el !== '_barong_session' && params[el]) {
					memo.push(`${el}=${encodeURIComponent(params[el])}`);
				}
				return memo;
			}, [])
			.join('&');
		const response = await fetch(`${baseURL}account/withdraws/?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const res = await response.json();
		if (response.status === 200) {
			const result = {
				withdraws: res.map((el) => {
					return {
						...el,
						created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at,
						updated_at: el.updated_at ? new Date(el.updated_at).getTime() / 1000 : el.updated_at,
						done_at: el.done_at ? new Date(el.done_at).getTime() / 1000 : el.done_at
					};
				})
			};
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
		return { ...res, status: response.status };
	}

	async getTradeHistory(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const query = Object.keys(params)
			.reduce((memo, el) => {
				if (el !== '_barong_session' && params[el]) {
					if (typeof params[el] === 'string') {
						memo.push(`${el}=${encodeURIComponent(params[el].toLowerCase())}`);
					} else {
						memo.push(`${el}=${encodeURIComponent(params[el])}`);
					}
				}
				return memo;
			}, [])
			.join('&');
		const response = await fetch(`${baseURL}market/trades/?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const res = await response.json();
		if (response.status === 200) {
			return {
				...paginationFromHeader(response.headers),
				trades: res.map((el) => {
					return {
						...el,
						created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at
					};
				})
			};
		}
		return { ...res, status: response.status };
	}

	async getOrderHistory(params, headers) {
		const { _barong_session } = params;
		let baseURL = headers && headers.authorization ? this.internalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		const query = Object.keys(params)
			.reduce((memo, el) => {
				if (el !== '_barong_session' && params[el]) {
					if (typeof params[el] === 'string') {
						memo.push(`${el}=${encodeURIComponent(params[el].toLowerCase())}`);
					} else {
						memo.push(`${el}=${encodeURIComponent(params[el])}`);
					}
				}
				return memo;
			}, [])
			.join('&');
		const response = await fetch(`${baseURL}market/orders/?${query}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const res = await response.json();
		if (response.status === 200) {
			return {
				...paginationFromHeader(response.headers),
				orders: res.map((el) => {
					return {
						...el,
						created_at: el.created_at ? new Date(el.created_at).getTime() / 1000 : el.created_at,
						updated_at: el.updated_at ? new Date(el.updated_at).getTime() / 1000 : el.updated_at
					};
				})
			};
		}
		return { ...res, status: response.status };
	}
}

module.exports = PeatioAPI;
