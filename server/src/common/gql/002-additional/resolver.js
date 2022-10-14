// const { paginateResults } = require('../../../utils');
const fetch = require('node-fetch');
const config = require('../../../../config.json');
//const { AuthenticationError, ApolloError } = require('apollo-server');
const { ApolloError } = require('apollo-server');

module.exports = {
	init: (pubsub, withFilter) => {
		return {
			Subscription: {
				globalTickers: {
					subscribe: () => pubsub.asyncIterator('globalTickers')
				},
				marketUpdate: {
					subscribe: (_, { market }) => pubsub.asyncIterator(`${market}.update`)
				},
				marketTrades: {
					subscribe: (_, { market }) => pubsub.asyncIterator(`${market}.trades`)
				},
				marketKLine: {
					subscribe: (_, { market, interval }) => pubsub.asyncIterator(`${market}.kline-${interval}`)
				},
				userOrders: {
					subscribe: async (_, { _barong_session, market }) => {
						const response = await fetch(`${config.barongURL}resource/users/me`, {
							method: 'GET',
							mode: 'cors',
							cache: 'no-cache',
							redirect: 'follow',
							referrer: 'no-referrer',
							headers: {
								'User-Agent': 'Exchange/proxy',
								'Content-Type': 'application/json;charset=utf-8',
								Cookie: `_barong_session=${_barong_session}`
							}
						});
						const user = await response.json();
						if (user.errors) {
							throw new ApolloError(user.errors.join(','), response.status);
						} else {
							return pubsub.asyncIterator(`order.${user.uid}.${market}`);
						}
					}
				},
				userTrades: {
					subscribe: async (_, { _barong_session, market }) => {
						const response = await fetch(`${config.barongURL}resource/users/me`, {
							method: 'GET',
							mode: 'cors',
							cache: 'no-cache',
							redirect: 'follow',
							referrer: 'no-referrer',
							headers: {
								'Content-Type': 'application/json;charset=utf-8',
								'User-Agent': 'Exchange/proxy',
								Cookie: `_barong_session=${_barong_session}`
							}
						});
						const user = await response.json();
						if (user.errors) {
							throw new ApolloError(user.errors.join(','), response.status);
						}
						return pubsub.asyncIterator(`trade.${user.uid}.${market}`);
					}
				}
			},
			Query: {
				authenteqEnabled: async(_, {}, {dataSources, headers}) => {
                    return config.authenteq && config.authenteq.enabled ? true : false;
                },
				depth: async (_, {market}, { dataSources }) => {
					const orderbook = await dataSources.peatioAPI.depth(market);
					if (orderbook.errors) {
						throw new ApolloError(orderbook.errors.join(','), orderbook.status);
					}
					return orderbook;
				},
				currencies: async (_, {}, { dataSources }) => {
					const currencies = await dataSources.peatioAPI.getAllCurrencies();
					if (currencies.errors) {
						throw new ApolloError(currencies.errors.join(','), currencies.status);
					}
					return currencies;
				},
				markets: async (_, { search }, { dataSources }) => {
					let markets = await dataSources.peatioAPI.getAllMarkets();
					if (markets.errors) {
						throw new ApolloError(markets.errors.join(','), markets.status);
					}
					if (search) {
						markets = markets.filter(
							(m) =>
								m.name.toLowerCase().includes(search.toLowerCase()) ||
								m.id.toLowerCase().includes(search.toLowerCase())
						);
					}
					return markets;
				},
				trades: async (_, { market }, { dataSources }) => {
					const trades = await dataSources.peatioAPI.getTrades(market);
					if (trades.errors) {
						throw new ApolloError(trades.errors.join(','), trades.status);
					}
					return trades.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime()).toFixed(0))
					}));
				},
				kLine: async (_, { market, period, time_from, time_to }, { dataSources }) => {
					const kline = await dataSources.peatioAPI.getKLine(market, period, time_from, time_to);
					if (kline.errors) {
						throw new ApolloError(kline.errors.join(','), kline.status);
					}
					return kline.map((m) => ({
						at: m[0],
						o: m[1],
						h: m[2],
						l: m[3],
						c: m[4],
						v: m[5]
					}));
				},
				balances: async (_, { _barong_session }, { dataSources, headers }) => {
					const currencies = await dataSources.peatioAPI.getAllCurrencies();
					const balances = await dataSources.peatioAPI.getBalances(_barong_session)
					if (balances.errors || currencies.errors) {
						const errors = [ ...new Set([...(balances.errors || []), ...(currencies.errors || [])])];
						throw new ApolloError(errors.join(','), currencies.status & balances.status);
					}
								const data = currencies.map((c) => {
									const balance = balances.find(b => b.currency === c.id);
									return {
										currency: c,
										balance: balance ? balance.balance : 0,
										locked: balance ? balance.locked : 0
									};
					});
					return data;
				},
				userWithProfile: async (_, { _barong_session }, { dataSources, headers }) => {
					const user = await dataSources.userAPI.getUserData(_barong_session, headers);
					if (user.errors) {
						throw new ApolloError(user.errors.join(','), user.status);
					}
					return user;
				},
				userOrders: async (
					_,
					{ _barong_session, market, state, limit, page, order_by, order_type, type },
					{ dataSources, headers }
				) => {
					const userOrders = await dataSources.peatioAPI.getUserOrders(
						{ _barong_session, market, state, limit, page, order_by, order_type, type },
						headers
					);
					if (userOrders.errors) {
						throw new ApolloError(userOrders.errors.join(','), userOrders.status);
					}
					return userOrders.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime()).toFixed(0)),
						updated_at: Number((new Date(m.updated_at).getTime()).toFixed(0))
					}));
				},
				userTrades: async (
					_,
					{ _barong_session, market, limit, page, time_from, time_to, order_by },
					{ dataSources, headers }
				) => {
					const userTrades = await dataSources.peatioAPI.getUserTrades(
						{ _barong_session, market, limit, page, time_from, time_to, order_by },
						headers
					);
					if (userTrades.errors) {
						throw new ApolloError(userTrades.errors.join(','), userTrades.status);
					}
					return userTrades.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime()).toFixed(0)),
						updated_at: Number((new Date(m.updated_at).getTime()).toFixed(0))
					}));
				},
				getDepositAddress: async (_, { _barong_session, currency }, { dataSources, headers }) => {
					const address = await dataSources.peatioAPI.getDepositAddress(
						{ _barong_session, currency },
						headers
					);
					if (address.errors) {
						throw new ApolloError(address.errors.join(','), address.status);
					}
					return address;
				},
				getBeneficiaries: async (_, { _barong_session, currency }, { dataSources, headers }) => {
					const result = await dataSources.peatioAPI.getBeneficiaries({ _barong_session }, headers);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					if (currency) {
						return result.map((el) => {
							return { ...el, ...el.data };
						}).filter(el => el.currency === currency);
					} else {
						return result.map((el) => {
							return { ...el, ...el.data };
						});
					}
				},
				getDepositHistory: async (
					_,
					{ _barong_session, currency, state, limit, page },
					{ dataSources, headers }
				) => {
					const result = await dataSources.peatioAPI.getDepositHistory(
						{ _barong_session, currency, state, limit, page },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				getWithdrawHistory: async (_, { _barong_session, currency, limit, page }, { dataSources, headers }) => {
					const result = await dataSources.peatioAPI.getWithdrawHistory(
						{ _barong_session, currency, limit, page },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				// getActivityHistory: async (_, { _barong_session, topic, page, limit }, { dataSources, headers }) => {
				// 	let result;
				// 	if (topic === 'ALL') {
				// 		const [ otpHistory, sessionHistory, passwordHistory ] = await Promise.all([
				// 			dataSources.userAPI.getActivityHistory(
				// 				{ _barong_session, topic: 'otp', page: 1, limit: 100 },
				// 				headers
				// 			),
				// 			dataSources.userAPI.getActivityHistory(
				// 				{ _barong_session, topic: 'session', page: 1, limit: 100 },
				// 				headers
				// 			),
				// 			dataSources.userAPI.getActivityHistory(
				// 				{ _barong_session, topic: 'password', page: 1, limit: 100 },
				// 				headers
				// 			)
				// 		]);
				// 		if (!otpHistory.errors && !sessionHistory.errors && !passwordHistory.errors) {
				// 			result = {
				// 				activities: [
				// 					...new Set([
				// 						...otpHistory.activities,
				// 						...sessionHistory.activities,
				// 						...passwordHistory.activities
				// 					])
				// 				]
				// 					.sort((a, b) => {
				// 						if (a.created_at > b.created_at) {
				// 							return -1;
				// 						}
				// 						if (a.created_at < b.created_at) {
				// 							return 1;
				// 						}
				// 						return 0;
				// 					})
				// 					.slice(((page || 1) - 1) * (limit || 25), (page || 1) * (limit || 25)),
				// 				perPage: limit || 25,
				// 				page: page || 1,
				// 				total:
				// 					otpHistory.activities.length +
				// 					sessionHistory.activities.length +
				// 					passwordHistory.activities.length
				// 			};
				// 		} else {
				// 			throw new ApolloError('', 500);
				// 		}
				// 	} else {
				// 		result = await dataSources.userAPI.getActivityHistory({ _barong_session, topic, page, limit });
				// 		if (result.errors) {
				// 			throw new ApolloError(result.errors.join(','), result.status);
				// 		}
				// 	}
				// 	return result;
				// },
				getActivityHistory: async(_, {_barong_session, topic, page, limit}, {dataSources}) => {
					let result = await dataSources.userAPI.getActivityHistory({_barong_session, topic, page, limit});
					if (result.errors) {
					  if (result.errors.join(',') === 'resource.user.no_activity') {
						return {
						  page: page,
						  perPage: limit,
						  total: 0,
						  activities: []
						}
					  }
					  throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				getTradeHistory: async (
					_,
					{ _barong_session, market, page, limit, order_by, time_from, time_to },
					{ dataSources, headers }
				) => {
					const [ markets, result ] = await Promise.all([
						dataSources.peatioAPI.getAllMarkets(),
						dataSources.peatioAPI.getTradeHistory(
							{ _barong_session, market, page, limit, order_by, time_from, time_to },
							headers
						)
					]);
					if (markets.errors || result.errors) {
						const errors = [ ...new Set([ ...(markets.errors || []), ...(result.errors || []) ]) ];
						throw new ApolloError(errors.join(','), markets.status & result.status);
					}
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {
						...result,
						trades: result.trades.map((el) => {
							return {
								...el,
								marketName: (markets.find((m) => m.id.toLowerCase() === el.market) || { name: '' }).name
							};
						})
					};
				},
				getOrderHistory: async (
					_,
					{ _barong_session, market, state, page, limit, order_by, type, ord_type },
					{ dataSources, headers }
				) => {
					const [ markets, result ] = await Promise.all([
						dataSources.peatioAPI.getAllMarkets(),
						dataSources.peatioAPI.getOrderHistory(
							{ _barong_session, market, state, page, limit, order_by, type, ord_type },
							headers
						)
					]);
					if (markets.errors || result.errors) {
						const errors = [ ...new Set([ ...(markets.errors || []), ...(result.errors || []) ]) ];
						throw new ApolloError(errors.join(','), markets.status & result.status);
					}
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {
						...result,
						orders: result.orders.map((el) => {
							return {
								...el,
								price: el.ord_type === 'market' || el.status === 'done' ? el.avg_price : el.price,
								marketName: (markets.find((m) => m.id.toLowerCase() === el.market) || { name: '' }).name
							};
						})
					};
				},
				getPhones: async (_, { _barong_session }, { dataSources, headers }) => {
					const result = await dataSources.authAPI.getPhones({ _barong_session }, headers);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				getUserApiKeys: async (_, { _barong_session }, { dataSources, headers }) => {
					const result = await dataSources.authAPI.getApiKeys({ _barong_session }, headers);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result.map(el => {
						return {
							...el,
							scope: el.scope.join(','),
							enabled: el.state === 'active' ? true : false
						}
					});
				},
			},
			Mutation: {
				login: async (_, { email, password, otp_code }, { dataSources }) => {
					const user = await dataSources.userAPI.login({ email, password, otp_code });
					if (user.errors) {
						throw new ApolloError(user.errors.join(','), user.status);
					}
					return user;
				},
				logout: async (_, { _barong_session }, { dataSources, headers }) => {
					const response = await dataSources.userAPI.logout(_barong_session, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				askResetPassword: async (_, { email, lang }, { dataSources }) => {
					const response = await dataSources.authAPI.askResetPassword({ email, lang });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				emailConfirm: async (_, { token, lang }, { dataSources }) => {
					const response = await dataSources.authAPI.confirmEmail({ token, lang });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				resetPassword: async (
					_,
					{ reset_password_token, password, confirm_password, lang },
					{ dataSources }
				) => {
					const response = await dataSources.authAPI.resetPassword({
						reset_password_token,
						password,
						confirm_password,
						lang
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				askEmailConfirm: async (_, { email, lang }, { dataSources }) => {
					const response = await dataSources.authAPI.askEmailConfirm({ email, lang });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				createUser: async (_, { email, password, refid, captcha_response, data, lang }, { dataSources }) => {
					const response = await dataSources.authAPI.createUser({
						email,
						password,
						refid,
						captcha_response,
						data,
						lang
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				askQRCodeOTP: async (_, { _barong_session }, { dataSources, headers }) => {
					const response = await dataSources.authAPI.askQRCodeOTP({ _barong_session }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response.data;
				},
				enableOTP: async (_, { _barong_session, code }, { dataSources, headers }) => {
					const response = await dataSources.authAPI.enableOTP({ _barong_session, code }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				disableOTP: async (_, { _barong_session, code }, { dataSources, headers }) => {
					const response = await dataSources.authAPI.disableOTP({ _barong_session, code }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				addPhone: async (_, { _barong_session, phone_number }, { dataSources, headers }) => {
					const response = await dataSources.authAPI.addPhone({ _barong_session, phone_number }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				verifyPhone: async (
					_,
					{ _barong_session, phone_number, verification_code },
					{ dataSources, headers }
				) => {
					const response = await dataSources.authAPI.verifyPhone(
						{ _barong_session, phone_number, verification_code },
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				saveProfile: async (
					_,
					{ _barong_session, first_name, last_name, dateOfBirth, address, postcode, city, country, metadata, confirm },
					{ dataSources, headers }
				) => {
					const response = await dataSources.authAPI.saveProfile(
						{
							_barong_session,
							first_name,
							last_name,
							dob: dateOfBirth,
							address,
							postcode,
							city,
							country,
							metadata,
							confirm
						},
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				askPhoneCode: async (_, { _barong_session, phone_number }, { dataSources, headers }) => {
					const response = await dataSources.authAPI.askPhoneCode({ _barong_session, phone_number }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				createOrder: async (
					_,
					{ _barong_session, market, side, volume, ord_type, price },
					{ dataSources, headers }
				) => {
					const response = await dataSources.peatioAPI.createOrder(
						{ _barong_session, market, side, volume, ord_type, price },
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				cancelOrder: async (_, { _barong_session, order_id }, { dataSources, headers }) => {
					const response = await dataSources.peatioAPI.cancelOrder({ _barong_session, order_id }, headers);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				cancelAllOrders: async (_, { _barong_session, market, side }, { dataSources, headers }) => {
					const response = await dataSources.peatioAPI.cancelAllOrders(
						{ _barong_session, market, side },
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				addBeneficiaryCoin: async (
					_,
					{ _barong_session, currency, address, name, description },
					{ dataSources, headers }
				) => {
					const result = await dataSources.peatioAPI.addBeneficiary(
						{ _barong_session, currency, data: { address }, name, description },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return Object.keys(result).reduce((memo, key) => {
						if (key === 'data') {
							if (result.data.address) {
								memo.address = result.data.address;
							}
						} else {
							memo[key] = result[key];
						}
						return memo;
					}, {});
				},
				addBeneficiaryFiat: async (
					_,
					{
						_barong_session,
						currency,
						full_name,
						account_number,
						bank_name,
						bank_swift_code,
						intermediary_bank_name,
						intermediary_bank_swift_code,
						name,
						description
					},
					{ dataSources, headers }
				) => {
					const data = { full_name };
					if (account_number) {
						data.account_number = account_number;
					}
					if (bank_name) {
						data.bank_name = bank_name;
					}
					if (bank_swift_code) {
						data.bank_swift_code = bank_swift_code;
					}
					if (intermediary_bank_name) {
						data.intermediary_bank_name = intermediary_bank_name;
					}
					if (intermediary_bank_swift_code) {
						data.intermediary_bank_swift_code = intermediary_bank_swift_code;
					}
					const result = await dataSources.peatioAPI.addBeneficiary(
						{ _barong_session, currency, data, name, description },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return Object.keys(result).reduce((memo, key) => {
						if (key === 'data') {
							if (result.data.address) {
								memo.address = result.data.address;
							}
							if (result.data.full_name) {
								memo.full_name = result.data.full_name;
							}
							if (result.data.bank_name) {
								memo.bank_name = result.data.bank_name;
							}
							if (result.data.bank_swift_code) {
								memo.bank_swift_code = result.data.bank_swift_code;
							}
							if (result.data.account_number) {
								memo.account_number = result.data.account_number;
							}
							if (result.data.intermediary_bank_name) {
								memo.intermediary_bank_name = result.data.intermediary_bank_name;
							}
							if (result.data.intermediary_bank_swift_code) {
								memo.intermediary_bank_swift_code = result.data.intermediary_bank_swift_code;
							}
						} else {
							memo[key] = result[key];
						}
						return memo;
					}, {});
				},
				deleteBeneficiary: async (_, { _barong_session, id }, { dataSources, headers }) => {
					const result = await dataSources.peatioAPI.deleteBeneficiary(
						{ _barong_session, id },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {data: 'ok'};
				},
				activateBeneficiary: async (_, { _barong_session, id, pin }, { dataSources, headers }) => {
					const result = await dataSources.peatioAPI.activateBeneficiary(
						{ _barong_session, id, pin },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				createWithdrawal: async (
					_,
					{ _barong_session, otp, beneficiary_id, currency, amount, note },
					{ dataSources, headers }
				) => {
					const result = await dataSources.peatioAPI.createWithdrawal(
						{ _barong_session, otp, beneficiary_id, currency, amount, note },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {...result, fee: result.fee ? Number(result.fee) : 0};
				},
				changePassword: async (
					_,
					{ _barong_session, old_password, new_password, confirm_password },
					{ dataSources, headers }
				) => {
					const response = await dataSources.authAPI.changePassword(
						{ _barong_session, old_password, new_password, confirm_password },
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				uploadKYCDocument: async (
					_,
					{ _barong_session, doc_type, doc_number, upload, doc_expire, metadata },
					{ dataSources, headers }
				) => {
					const file = await upload;
					const response = await dataSources.authAPI.uploadKYCDocument(
						{ _barong_session, doc_type, doc_number, upload: file, doc_expire, metadata },
						headers
					);
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				createApiKey: async (
					_,
					{ _barong_session, otp },
					{ dataSources, headers }
				) => {
					const result = await dataSources.authAPI.createApiKey(
						{ _barong_session, otp },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {
						...result,
						scope: result.scope.join(', '),
						enabled: result.state === 'active' ? true : false
					};
				},
				deleteApiKey: async (
					_,
					{ _barong_session, otp, kid },
					{ dataSources, headers }
				) => {
					const result = await dataSources.authAPI.deleteApiKey(
						{ _barong_session, otp, kid },
						headers
					);
					console.log('delete api key', result);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return {data: 'ok'};
				},
				updateApiKey: async (
					_,
					{ _barong_session, otp, kid, enabled },
					{ dataSources, headers }
				) => {
					const result = await dataSources.authAPI.updateApiKey(
						{ _barong_session, otp, kid, state: enabled ? 'active' : 'disabled' },
						headers
					);
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return { data: 'ok' };
				},
			},
			Market: {
				async base_unit(parent, params, context) {
					const code = parent.base_unit;
					const { dataSources } = context;
					const data = await dataSources.peatioAPI.getCurrency(code);
					if (data.errors) {
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async quote_unit(parent, params, context) {
					const code = parent.quote_unit;
					const { dataSources } = context;
					const data = await dataSources.peatioAPI.getCurrency(code);

					if (data.errors) {
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async ticker(parent, params, context) {
					const id = parent.id;
					const { dataSources } = context;
					const data = await dataSources.peatioAPI.getMarketTicker(id);
					if (data.errors) {
						// throw new ApolloError(data.errors.join(','), data.status);
						return {};
					}
					return data.ticker;
				}
			},
			// Balance: {
			// 	async currency(parent, params, context) {
			// 		const code = parent.currency;
			// 		const { dataSources } = context;
			// 		const data = await dataSources.peatioAPI.getCurrency(code);
			// 		if (data.errors) {
			// 			throw new ApolloError(data.errors.join(','), data.status);
			// 		}
			// 		return data;
			// 	}
            // },
		};
	}
};
