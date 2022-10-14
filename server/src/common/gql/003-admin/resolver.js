// const { paginateResults } = require('../../../utils');
const fetch = require('node-fetch');
const config = require('../../../../config.json');
//const { AuthenticationError, ApolloError } = require('apollo-server');
const { ApolloError } = require('apollo-server');
const checkAdminPermission = require('../../datasources/checkAdminPermission');

module.exports = {
	init: (pubsub, withFilter) => {
		return {
			Query: {
				adminMetrics:  async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					console.log('METRICs');
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'dashboard', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						if (context.dataSources.barongPool) {
							
							const totalUsers = context.dataSources.barongPool.query("SELECT COUNT(*) as usersTotal from users;");
							const last24hUsers = context.dataSources.barongPool.query("SELECT COUNT(*) as users24H from users where created_at>=NOW() - INTERVAL 1 DAY;");

							const totalDeposits = context.dataSources.peatioPool.query("SELECT COUNT(*) as depositsTotal from deposits;");
							const last24hDeposits= context.dataSources.peatioPool.query("SELECT COUNT(*) as deposits24H from deposits where created_at>=NOW() - INTERVAL 1 DAY;");

							const totalWithdraws = context.dataSources.peatioPool.query("SELECT COUNT(*) as withdrawsTotal from withdraws;");
							const last24hWithdraws= context.dataSources.peatioPool.query("SELECT COUNT(*) as withdraws24H from withdraws where created_at>=NOW() - INTERVAL 1 DAY;");

							const totalOrders = context.dataSources.peatioPool.query("SELECT COUNT(*) as ordersTotal from orders;");
							const totalPendingOrders = context.dataSources.peatioPool.query("SELECT COUNT(*) as ordersTotalPending from orders where state=100;");
							const last24hOrders = context.dataSources.peatioPool.query("SELECT COUNT(*) as orders24H from orders where created_at>=NOW() - INTERVAL 1 DAY;");
							const last24hFilledOrders= context.dataSources.peatioPool.query("SELECT COUNT(*) as orders24HFilled from orders where volume=0 AND created_at>=NOW() - INTERVAL 1 DAY;");
							const last24hPartialOrders= context.dataSources.peatioPool.query("SELECT COUNT(*) as orders24HPartialFilled from orders where state=100 AND updated_at>=NOW() - INTERVAL 1 DAY;");



							const totalTrades = context.dataSources.peatioPool.query("SELECT COUNT(*) as tradesTotal from trades;");
							const last24hTrades= context.dataSources.peatioPool.query("SELECT COUNT(*) as trades24H from trades where created_at>=NOW() - INTERVAL 1 DAY;");

							const result = await Promise.all([
								totalUsers, last24hUsers, 
								totalDeposits, last24hDeposits, 
								totalWithdraws, last24hWithdraws,
								totalOrders, totalPendingOrders, last24hOrders, last24hFilledOrders, last24hPartialOrders,
								totalTrades, last24hTrades, 
							]);
							const res = result.reduce( (accumulator, currentValue) => ({...accumulator, ...currentValue[0][0] }), {});
							return res;
						}
							/*
							const [total] = await context.dataSources.barongPool.query("SELECT COUNT(*) as TotalUsers from users;");
							const [last24h] = await context.dataSources.barongPool.query("SELECT COUNT(*) as Users24H from users where created_at>=NOW() - INTERVAL 1 DAY;");
							
							console.log(total, total.TotalUsers, last24h, last24h.Users24H);
							return {
								usersTotal: total[0].TotalUsers,
								users24H: last24h[0].Users24H
							*/
						
					} else {
						if (user) {
							throw new ApolloError("admin.ability.not_permitted", 403);
						}
						throw new ApolloError("Not authorized", 403);
					}
				},
				adminUsers: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						delete params['_barong_session'];
						const userList = await dataSources.barongAdminAPI.adminListUsers(_barong_session, params, headers);
						if (userList.errors) {
							throw new ApolloError(userList.errors.join(','), userList.status);
						}
						return userList;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminUserActivities: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						delete params['_barong_session'];
						const data = await dataSources.barongAdminAPI.adminUserActivities(_barong_session, params, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminUserWithoutActivities: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, userId } = params;
						const { dataSources, headers } = context;
						const user = await dataSources.barongAdminAPI.adminUser(_barong_session, params.uid, headers);

						if (user.errors) {
							throw new ApolloError(user.errors.join(','), user.status);
						}
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				}, 
				adminUser: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, userId } = params;
						const { dataSources, headers } = context;
						const user = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

						if (user.errors) {
							throw new ApolloError(user.errors.join(','), user.status);
						}
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminUserByLabel: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const users = await dataSources.barongAdminAPI.adminUserByLabel(_barong_session, params, headers);

						if (users.errors) {
							throw new ApolloError(user.errors.join(','), user.status);
						}
						return users;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminLabels: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const labels = await dataSources.barongAdminAPI.adminLabels(_barong_session, headers);

						if (labels.errors) {
							throw new ApolloError(labels.errors.join(','), labels.status);
						}
						return labels;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminLevels: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const levels = await dataSources.barongAdminAPI.adminLevels(_barong_session, headers);

						if (levels.errors) {
							throw new ApolloError(levels.errors.join(','), levels.status);
						}
						return levels;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
                adminBlockchain: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, id } = params;
						const { dataSources, headers } = context;
						const blockchains = await dataSources.peatioAdminAPI.blockchain(_barong_session, id, headers);

						if (blockchains.errors) {
							throw new ApolloError(blockchains.errors.join(','), blockchains.status);
						}
						return blockchains;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminBlockchains: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const blockchains = await dataSources.peatioAdminAPI.blockchains(_barong_session, headers);

						if (blockchains.errors) {
							throw new ApolloError(blockchains.errors.join(','), blockchains.status);
						}
						return blockchains;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminBlockchainClients: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.blockchainClients(_barong_session, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminWalletGateways: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.walletGateways(_barong_session, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCurrency: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, code } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCurrencies: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					if (context.user.role !== "member") {
						const { _barong_session } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.currencies(_barong_session, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminMarket: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, id } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.market(_barong_session, id, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminMarkets: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					if (context.user.role !== "member") {
						const { _barong_session } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.markets(_barong_session, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminWallet: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, id } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.wallet(_barong_session, id, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
                adminWallets: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configurations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const reqParams = {...params};
						delete reqParams._barong_session;
						const data = await dataSources.peatioAdminAPI.wallets(_barong_session, reqParams, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminTradingFees: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					if (context.user.role !== "member") {
						const { _barong_session } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.tradingFees(_barong_session, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminDeposits: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqParams = {...params};
						delete reqParams._barong_session;
						const data = await dataSources.peatioAdminAPI.deposits(_barong_session, reqParams, headers);

						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminDeposit: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session, tid } = params;
						const { dataSources, headers } = context;

						const data = await dataSources.peatioAdminAPI.deposit(_barong_session, tid, headers);
						console.log("DEPOSIT", data)
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminPending: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const {_barong_session} = params;
						const { dataSources, headers } = context;
						const reqData = { ...params };
						delete reqData._barong_session;
						const data = await dataSources.barongAdminAPI.pending(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminWithdraws: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const {_barong_session} = params;
						const { dataSources, headers } = context;
						const reqData = { ...params };
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.withdraws(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminWithdraw: async (_, { _barong_session, id }, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.withdraw(_barong_session, id, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminAdjustments: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.adjustments(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminAdjustment: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session, id } = params;
						const data = await dataSources.peatioAdminAPI.adjustment(_barong_session, id, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminAssets: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						reqData.ordering = 'desc';
						const data = await dataSources.peatioAdminAPI.assets(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminExpenses: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						reqData.ordering = 'desc';
						const data = await dataSources.peatioAdminAPI.expenses(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminRevenues: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						reqData.ordering = 'desc';
						const data = await dataSources.peatioAdminAPI.revenues(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminLiabilities: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						reqData.ordering = 'desc';
						const data = await dataSources.peatioAdminAPI.liabilities(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminOrders: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.adminOrders(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminTrades: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.adminTrades(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminMembers: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.adminMembers(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminMember: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session, uid } = params;
						const data = await dataSources.peatioAdminAPI.adminMember(_barong_session, uid, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminAvailableGroups: async(_, _barong_session, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.availableGroup(_barong_session, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminPermissions: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete params._barong_session;
						const data = await dataSources.barongAdminAPI.adminPermissions(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminRestrictions: async(_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete params._barong_session;
						const data = await dataSources.barongAdminAPI.adminRestrictions(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
			},
			Mutation: {
				createBlockchain: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const blockchain = await dataSources.peatioAdminAPI.createBlockchain(params, headers);
						if (blockchain.errors) {
							throw new ApolloError(blockchain.errors.join(','), blockchain.status);
						}
						return blockchain;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateBlockchain: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						
						const blockchain = await dataSources.peatioAdminAPI.updateBlockchain(params, headers);
						if (blockchain.errors) {
							throw new ApolloError(blockchain.errors.join(','), blockchain.status);
						}
						return blockchain;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				resetBlockchainHeight: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const blockchain = await dataSources.peatioAdminAPI.updateBlockchain(params, headers);
						if (blockchain.errors) {
							throw new ApolloError(blockchain.errors.join(','), blockchain.status);
						}
						return blockchain;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createWallet: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.createWallet(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateWallet: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.updateWallet(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateWalletSettings: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.updateWallet(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createMarket: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.createMarket(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateMarket: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.updateMarket(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createCurrency: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.createCurrency(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateCurrency: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.updateCurrency(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createTradingFee: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.createTradingFee(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateTradingFee: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'configuration', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.updateTradingFee(params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateUserAttributes: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.updateUserAttributes(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createUserLabel: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.createUserLabel(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateUserLabelValue: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.updateUserLabel(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				deleteUserLabel: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.deleteUserLabel(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateUserRole: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.updateUserRole(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				updateUserProfile: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.updateUserProfile(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const user = await dataSources.barongAdminAPI.adminUser(params._barong_session, params.uid, headers);
						return user;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				createDeposit: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.createDeposit(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				actionDeposit: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { _barong_session } = params;
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.actionDeposit(_barong_session, params, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				actionWithdraw: async (_, {_barong_session, id, action, txid}, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.actionWithdraw(_barong_session, id, action, txid, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						const withdraw = await dataSources.peatioAdminAPI.withdraw(_barong_session, id, headers);
						return withdraw;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCreateAdjustment: async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.peatioAdminAPI.createAdjustment(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				actionAdjustment:  async (_, { _barong_session, id, action }, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.actionAdjustment(_barong_session, id, action, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCancelOrder:  async (_, { _barong_session, id }, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'operations', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.adminCancelOrder(_barong_session, id, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminSetUserGroup:  async (_, { _barong_session, uid, group }, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'users', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.peatioAdminAPI.setUserGroup(_barong_session, uid, group, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCreatePermission:  async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.barongAdminAPI.createPermission(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminUpdatePermission:  async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.barongAdminAPI.updatePermission(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminDeletePermission:  async (_, {_barong_session, id}, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.deletePermission(_barong_session, id, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminCreateRestriction:  async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.barongAdminAPI.createRestriction(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminUpdateRestriction:  async (_, params, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const { _barong_session } = params;
						const reqData = {...params};
						delete reqData._barong_session;
						const data = await dataSources.barongAdminAPI.updateRestriction(_barong_session, reqData, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
				adminDeleteRestriction:  async (_, {_barong_session, id}, context) => {
					if (!context.user) {
						throw new ApolloError("Not authorized", 401);
					}
					let perm;
					try {
						perm = await checkAdminPermission(context.dataSources.barongPool, context.user.role, 'devops', 'ALL');
					} catch (err) {
						if (["admin", "superadmin"].indexOf(context.user.role) < 0) {
							throw new ApolloError("No connection to db", 500);
						}
					}
					if ((perm && perm[0][0].permissionCount > 0) || ["admin", "superadmin"].indexOf(context.user.role) > -1) {
						const { dataSources, headers } = context;
						const data = await dataSources.barongAdminAPI.deleteRestriction(_barong_session, id, headers);
						if (data.errors) {
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return {data: 200};
					}
					throw new ApolloError('admin.ability.not_permitted', 403);
				},
			},
			User: {
				activities(parent, params, context) {
					//console.log('ACTIVITIES', parent, params, context);
					return [ { key: '1', value: '2', scope: '3' } ];
				}
			},
			AdminUser: {
				async activities(parent, params, context) {
					const {page=1, limit=50} = params;
					const {uid} = parent;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUserActivities(_barong_session, {uid, page, limit}, headers);
					if (data.errors) {
						return [];
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data.result;
				}
			},
			AdminOrder: {
				async user(parent, params, context) {
					const userId = parent.uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async market(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;
					const marketId = parent.market;
					const data = await dataSources.peatioAdminAPI.market(_barong_session, marketId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					
					return data;
                },
			},
			AdminTrade: {
				async taker(parent, params, context) {
					const userId = parent.taker_uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async maker(parent, params, context) {
					const userId = parent.maker_uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
                async market(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;
					const marketId = parent.market;
					const data = await dataSources.peatioAdminAPI.market(_barong_session, marketId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					
					return data;
                },
			},
            AdminCurrency: {

                async blockchain(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.blockchains(_barong_session, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data.find(b=>b.key===parent.blockchain_key);
                },
                async markets(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.markets(_barong_session, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					
					return data.filter(m=>(m.quote_unit===parent.code)||(m.base_unit===parent.code));
                },
                async wallets(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.wallets(_barong_session, {currency: parent.code}, headers);

					if (data.errors) {
						return [];
						throw new ApolloError(data.errors.join(','), data.status);
					}
					
					return data.result;
                },
			},
			AdminAccount: {
				async currency(parent, params, context) {
					const code = parent.currency_code;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);
					if (data.errors) {
						return {code: code, name: code.toUpperCase()};
						// throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
			},
			AdminMember: {
				async user(parent, params, context) {
					const userId = parent.uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
			},
			AdminOperation: {
				async currency(parent, params, context) {
					const code = parent.currency_code;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);
					if (data.errors) {
						return null;
						return {code: code, name: code.toUpperCase()};
						// throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async member(parent, params, context) {
					const userId = parent.uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
			},
			AdminAdjustment: {
				async currency(parent, params, context) {
					const code = parent.currency_code;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

					if (data.errors) {
						return null;
						console.log("CURRENCY", _barong_session,code, data)
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async creator(parent, params, context) {
					const userId = parent.creator_uid;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);
					if (data.errors) {
						return null;
						console.log("creator", _barong_session, userId, data)
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async validator(parent, params, context) {
					const userId = parent.validator_uid;
					if (!userId) {
						return {};
					}
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async receiving_member(parent, params, context) {
					const userId = parent.receiving_member_uid;
					if (userId) {
						const { dataSources, headers, _barong_session } = context;
						const data = await dataSources.barongAdminAPI.adminUser(_barong_session, userId, headers);

						if (data.errors) {
							return null;
							throw new ApolloError(data.errors.join(','), data.status);
						}
						return data;
					}
					return null;
				},
			},
            AdminBlockchain: {
                async currencies(parent, params, context) {
					const { dataSources, headers, _barong_session } = context;

					const data = await dataSources.peatioAdminAPI.currencies(_barong_session, headers);

					if (data.errors) {
						return [];
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data.filter(c=>c.blockchain_key===parent.key).map(d=>({...d, options:Object.entries(d.options||[]).map(([key, value]) => ({key,value}))}));
                }
			},
			AdminDeposit: {
				async currency(parent, params, context) {
					console.log("AdminDeposit->Currency", parent)
					const code = parent.currency_code;
					
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async member(parent, params, context) {
					//console.log("AdminDeposit->Member", parent)
					const uid = parent.uid;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.adminMember(_barong_session, uid, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
			},
			AdminWithdraw: {
				async currency(parent, params, context) {
					const code = parent.currency_code;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async member(parent, params, context) {
					const uid = parent.uid;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.adminMember(_barong_session, uid, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				}
			},
			AdminMarket: {
				async base_currency(parent, params, context) {
					const code = parent.base_unit;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				},
				async quote_currency(parent, params, context) {
					const code = parent.quote_unit;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				}
            },
            AdminWallet: {
                async blockchain(parent, params, context) {
     
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.blockchains(_barong_session, headers);

					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data.find(b=>b.key===parent.blockchain_key);
                },
                async currency(parent, params, context) {
					const code = parent.currency_code;
					const { dataSources, headers, _barong_session } = context;
					const data = await dataSources.peatioAdminAPI.currency(_barong_session, code, headers);
					if (data.errors) {
						return null;
						throw new ApolloError(data.errors.join(','), data.status);
					}
					return data;
				}
            }
		};
	}
};
