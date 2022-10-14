const { paginateResults } = require('./utils');
const fetch = require('node-fetch');
const config = require('../config.json');
const { AuthenticationError, ApolloError } = require('apollo-server');

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
				currencies: async (_, {}, { dataSources }) => {
					const currencies = await dataSources.peatioAPI.getAllCurrencies();
					if (currencies.errors) {
						throw new ApolloError(currencies.errors.join(','), currencies.status);
					}
					return currencies;
				},
				markets: async (_, { search }, { dataSources }) => {
					let [ markets, tickers, currencies ] = await Promise.all([
						dataSources.peatioAPI.getAllMarkets(),
						dataSources.peatioAPI.getAllMarketTickers(),
						dataSources.peatioAPI.getAllCurrencies()
					]);
					if (markets.errors || tickers.errors || currencies.errors) {
						const errors = [
							...new Set([
								...(markets.errors || []),
								...(tickers.errors || []),
								...(currencies.errors || [])
							])
						];
						throw new ApolloError(errors.join(','), markets.status & tickers.status & currencies.status);
					}
					if (search) {
						markets = markets.filter(
							(m) =>
								m.name.toLowerCase().includes(search.toLowerCase()) ||
								m.id.toLowerCase().includes(search.toLowerCase())
						);
					}
					return markets.map((m) => ({
						...m,
						ticker: { ...(tickers[m.id] || {}).ticker, at: (tickers[m.id] || {}).at },
						base_unit: currencies.find((c) => c.id === m.base_unit) || {},
						quote_unit: currencies.find((c) => c.id === m.quote_unit) || {}
					}));
				},
				trades: async (_, { market }, { dataSources }) => {
					const trades = await dataSources.peatioAPI.getTrades(market);
					if (trades.errors) {
						throw new ApolloError(trades.errors.join(','), trades.status);
					}
					return trades.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime() / 1000).toFixed(0))
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
				balances: async (_, { _barong_session }, { dataSources }) => {
					const currencies = await dataSources.peatioAPI.getAllCurrencies();
					const balances = await dataSources.peatioAPI.getBalances(_barong_session);
					if (balances.errors || currencies.errors) {
						const errors = [ ...new Set([ ...(balances.errors || []), ...(currencies.errors || []) ]) ];
						throw new ApolloError(errors.join(','), currencies.status & balances.status);
					}
					return balances.map((b) => ({
						...b,
						currency: currencies.find((c) => c.id === b.currency)
					}));
				},
				userWithProfile: async (_, { _barong_session }, { dataSources }) => {
					const user = await dataSources.userAPI.getUserData(_barong_session);
					if (user.errors) {
						throw new ApolloError(user.errors.join(','), user.status);
					}
					return user;
				},
				userOrders: async (
					_,
					{ _barong_session, market, state, limit, page, order_by, order_type, type },
					{ dataSources }
				) => {
					const userOrders = await dataSources.peatioAPI.getUserOrders({
						_barong_session,
						market,
						state,
						limit,
						page,
						order_by,
						order_type,
						type
					});
					if (userOrders.errors) {
						throw new ApolloError(userOrders.errors.join(','), userTrades.status);
					}
					return userOrders.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime() / 1000).toFixed(0)),
						updated_at: Number((new Date(m.updated_at).getTime() / 1000).toFixed(0))
					}));
				},
				userTrades: async (
					_,
					{ _barong_session, market, limit, page, time_from, time_to, order_by },
					{ dataSources }
				) => {
					const userTrades = await dataSources.peatioAPI.getUserTrades({
						_barong_session,
						market,
						limit,
						page,
						time_from,
						time_to,
						order_by
					});
					if (userTrades.errors) {
						throw new ApolloError(userTrades.errors.join(','), userTrades.status);
					}
					return userTrades.map((m) => ({
						...m,
						created_at: Number((new Date(m.created_at).getTime() / 1000).toFixed(0)),
						updated_at: Number((new Date(m.updated_at).getTime() / 1000).toFixed(0))
					}));
				},
				getDepositAddress: async (_, { _barong_session, currency }, { dataSources }) => {
					const address = await dataSources.peatioAPI.getDepositAddress({ _barong_session, currency });
					if (address.errors) {
						throw new ApolloError(address.errors.join(','), address.status);
					}
					return address;
				},
				getBeneficiaries: async (_, { _barong_session, currency }, { dataSources }) => {
					const result = await dataSources.peatioAPI.getBeneficiaries({ _barong_session });
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					if (currency) {
						
						return result.reduce((memo, el) => {
							if (el.currency === currency) {
								if (el.data.address) {
									memo.push({ ...el, address: el.data.address });
								}
								if (el.data.full_name) {
									memo.push({ ...el, full_name: el.data.full_name });
								}
								if (el.data.bank_name) {
									memo.push({ ...el, bank_name: el.data.bank_name });
								}
								if (el.data.bank_swift_code) {
									memo.push({ ...el, bank_swift_code: el.data.bank_swift_code });
								}
								if (el.data.account_number) {
									memo.push({ ...el, account_number: el.data.account_number });
								}
								if (el.data.intermediary_bank_name) {
									memo.push({ ...el, intermediary_bank_name: el.data.intermediary_bank_name });
								}
								if (el.data.intermediary_bank_swift_code) {
									memo.push({
										...el,
										intermediary_bank_swift_code: el.data.intermediary_bank_swift_code
									});
								}
							}
							return memo;
						}, []);
					}
					return result.map((el) => {
						return { ...el, address: el.data.address };
					});
				},
				getDepositHistory: async (_, { _barong_session, currency, state, limit, page }, { dataSources }) => {
					const result = await dataSources.peatioAPI.getDepositHistory({
						_barong_session,
						currency,
						state,
						limit,
						page
					});
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				getWithdrawHistory: async (_, { _barong_session, currency, limit, page }, { dataSources }) => {
					const result = await dataSources.peatioAPI.getWithdrawHistory({
						_barong_session,
						currency,
						limit,
						page
					});
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				getActivityHistory: async (_, { _barong_session, topic, page, limit }, { dataSources }) => {
					let result;
					if (topic === 'ALL') {
						const [ otpHistory, sessionHistory, passwordHistory ] = await Promise.all([
							dataSources.userAPI.getActivityHistory({
								_barong_session,
								topic: 'otp',
								page: 1,
								limit: 100
							}),
							dataSources.userAPI.getActivityHistory({
								_barong_session,
								topic: 'session',
								page: 1,
								limit: 100
							}),
							dataSources.userAPI.getActivityHistory({
								_barong_session,
								topic: 'password',
								page: 1,
								limit: 100
							})
						]);
						if (!otpHistory.errors && !sessionHistory.errors && !passwordHistory.errors) {
							result = {
								activities: [
									...new Set([
										...otpHistory.activities,
										...sessionHistory.activities,
										...passwordHistory.activities
									])
								]
									.sort((a, b) => {
										if (a.created_at > b.created_at) {
											return -1;
										}
										if (a.created_at < b.created_at) {
											return 1;
										}
										return 0;
									})
									.slice(((page || 1) - 1) * (limit || 25), (page || 1) * (limit || 25)),
								perPage: limit || 25,
								page: page || 1,
								total:
									otpHistory.activities.length +
									sessionHistory.activities.length +
									passwordHistory.activities.length
							};
						} else {
							throw new ApolloError('', 500);
						}
					} else {
						result = await dataSources.userAPI.getActivityHistory({ _barong_session, topic, page, limit });
						if (result.errors) {
							throw new ApolloError(result.errors.join(','), result.status);
						}
					}
					return result;
				},
				getTradeHistory: async (
					_,
					{ _barong_session, market, page, limit, order_by, time_from, time_to },
					{ dataSources }
				) => {
					const [ markets, result ] = await Promise.all([
						dataSources.peatioAPI.getAllMarkets(),
						dataSources.peatioAPI.getTradeHistory({
							_barong_session,
							market,
							page,
							limit,
							order_by,
							time_from,
							time_to
						})
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
					{ dataSources }
				) => {
					const [ markets, result ] = await Promise.all([
						dataSources.peatioAPI.getAllMarkets(),
						dataSources.peatioAPI.getOrderHistory({
							_barong_session,
							market,
							state,
							page,
							limit,
							order_by,
							type,
							ord_type
						})
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
				getPhones: async (_, { _barong_session }, { dataSources }) => {
					const result = await dataSources.authAPI.getPhones({ _barong_session });
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				}
			},
			Mutation: {
				login: async (_, { email, password, otp_code }, { dataSources }) => {
					const user = await dataSources.userAPI.login({ email, password, otp_code });
					if (user.errors) {
						throw new ApolloError(user.errors.join(','), user.status);
					}
					return user;
				},
				logout: async (_, { _barong_session }, { dataSources }) => {
					const response = await dataSources.userAPI.logout(_barong_session);
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
				askQRCodeOTP: async (_, { _barong_session }, { dataSources }) => {
					const response = await dataSources.authAPI.askQRCodeOTP({ _barong_session });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response.data;
				},
				enableOTP: async (_, { _barong_session, code }, { dataSources }) => {
					const response = await dataSources.authAPI.enableOTP({ _barong_session, code });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				disableOTP: async (_, { _barong_session, code }, { dataSources }) => {
					const response = await dataSources.authAPI.disableOTP({ _barong_session, code });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				addPhone: async (_, { _barong_session, phone_number }, { dataSources }) => {
					const response = await dataSources.authAPI.addPhone({ _barong_session, phone_number });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				verifyPhone: async (_, { _barong_session, phone_number, verification_code }, { dataSources }) => {
					const response = await dataSources.authAPI.verifyPhone({
						_barong_session,
						phone_number,
						verification_code
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				saveProfile: async (
					_,
					{ _barong_session, first_name, last_name, dateOfBirth, address, postcode, city, country, metadata },
					{ dataSources }
				) => {
					const response = await dataSources.authAPI.saveProfile({
						_barong_session,
						first_name,
						last_name,
						dob: dateOfBirth,
						address,
						postcode,
						city,
						country,
						metadata
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				askPhoneCode: async (_, { _barong_session, phone_number }, { dataSources }) => {
					const response = await dataSources.authAPI.askPhoneCode({ _barong_session, phone_number });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				createOrder: async (_, { _barong_session, market, side, volume, ord_type, price }, { dataSources }) => {
					const response = await dataSources.peatioAPI.createOrder({
						_barong_session,
						market,
						side,
						volume,
						ord_type,
						price
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				cancelOrder: async (_, { _barong_session, order_id }, { dataSources }) => {
					const response = await dataSources.peatioAPI.cancelOrder({ _barong_session, order_id });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				cancelAllOrders: async (_, { _barong_session, market, side }, { dataSources }) => {
					const response = await dataSources.peatioAPI.cancelAllOrders({ _barong_session, market, side });
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return response;
				},
				addBeneficiaryCoin: async (
					_,
					{ _barong_session, currency, address, name, description },
					{ dataSources }
				) => {
					const result = await dataSources.peatioAPI.addBeneficiary({
						_barong_session,
						currency,
						data: { address },
						name,
						description
					});
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
					{ dataSources }
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
					const result = await dataSources.peatioAPI.addBeneficiary({
						_barong_session,
						currency,
						data,
						name,
						description
					});
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
				activateBeneficiary: async (_, { _barong_session, id, pin }, { dataSources }) => {
					const result = await dataSources.peatioAPI.activateBeneficiary({ _barong_session, id, pin });
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				createWithdrawal: async (
					_,
					{ _barong_session, otp, beneficiary_id, currency, amount, note },
					{ dataSources }
				) => {
					const result = await dataSources.peatioAPI.createWithdrawal({
						_barong_session,
						otp,
						beneficiary_id,
						currency,
						amount,
						note
					});
					if (result.errors) {
						throw new ApolloError(result.errors.join(','), result.status);
					}
					return result;
				},
				changePassword: async (
					_,
					{ _barong_session, old_password, new_password, confirm_password },
					{ dataSources }
				) => {
					const response = await dataSources.authAPI.changePassword({
						_barong_session,
						old_password,
						new_password,
						confirm_password
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				},
				uploadKYCDocument: async (
					_,
					{ _barong_session, doc_type, doc_number, upload, doc_expire, metadata },
					{ dataSources }
				) => {
					const file = await upload;
					const response = await dataSources.authAPI.uploadKYCDocument({
						_barong_session,
						doc_type,
						doc_number,
						upload: file,
						doc_expire,
						metadata
					});
					if (response.errors) {
						throw new ApolloError(response.errors.join(','), response.status);
					}
					return { data: 'ok' };
				}
			}
		};
	}
};
