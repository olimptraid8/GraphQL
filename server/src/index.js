// Dependencies
require('dotenv').config();
const cors = require('cors')
const logger = require('./logger');
const http = require('http');
const express = require('express');
const config = require('../config.json');
// const WebSocket = require("ws");
const { ApolloServer, gql } = require('apollo-server-express');
const { PubSub, withFilter } = require('graphql-subscriptions');
const path = require('path');
const jwt = require('jsonwebtoken');
const combine = require('./combine');
const streams = require('./common/datasources/streams');
const commonAPI = require('./common/datasources');
const customAPI = require('./custom/datasources');

const jwtPublicKey = process.env.JWT_PUBLIC_KEY
	? new Buffer(process.env.JWT_PUBLIC_KEY, 'base64').toString('ascii')
	: null;
const pubsub = new PubSub();

// Get combined typeDefs and resolvers
let { typeDefs, resolvers } = combine({
	// TypeDefs glob pattern
	typeDefs: path.join(__dirname, '{common,custom}/gql/*/schema.graphql'),
	// Resolvers glob pattern
	resolvers: path.join(__dirname, '{common,custom}/gql/*/resolver.js'),
	pubsub,
	withFilter
});

const dataSources = () => ({ ...commonAPI, ...customAPI });

// Set up Apollo Server
const app = express();
app.use(cors({ credentials: true }))
const server = new ApolloServer({
	typeDefs,
	resolvers,
	dataSources,
	debug: true,
	subscriptions: {
		keepAlive: 1000,
		onDisconnect: (websocket, context) => {
			logger('ERROR', [ 'WS DISCONNECTED', context.request.headers ]);
		}
	},
	introspection: true,
	playground: true,
	context: async ({ req }) => {
		// console.log('PATH', req.path);
		const headers = req ? req.headers : {};
		let _barong_session = '';
		let user = null;
		// console.log("headers.authorization",  headers.authorization);
		// console.log("Input HEADERS:", headers);
		if (jwtPublicKey && headers.authorization) {
			let a = headers.authorization.split(' ')[1];
			user = jwt.verify(a, jwtPublicKey);
			// console.log('JWT USER', user);
		} else {
			if (req && req.body && req.body.variables &&  req.body.variables._barong_session) {
				_barong_session = req.body.variables._barong_session;
			} else {
				let query = req && req.body && req.body.query ? gql`${req.body.query}` : null;
				
				if (query && query.definitions) {
					
						
					query.definitions.forEach(async (def) => {
						if (def.selectionSet && def.selectionSet.selections) {
							def.selectionSet.selections.forEach(async (sel) => {
								if (sel.arguments) {
									const args = sel.arguments;	
									const arg = args.find(
										(arg) => (arg.name ? arg.name.value == '_barong_session' : false)
									);
					
									if (arg) {
										_barong_session = arg.value ? arg.value.value : '';
										
									}
								}
								if (sel.name) {
									console.log('REQUEST', sel.name.value);
								}
							});
						}
					});
				}
			}
			
			if (_barong_session || (headers && headers.authorization)) {
				user = await dataSources().userAPI.getUserData(_barong_session, headers);
			}
			// console.log('User FOUND:', user);
			// console.log('USER', user ? user.email : 'none');
			// console.log('_barong_session', _barong_session);
		}
		return { headers, user, _barong_session };
	},
	engine: {
		apiKey: process.env.ENGINE_API_KEY
	}
});
server.applyMiddleware({ app });

streams(pubsub);

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(4000, (url) => {
	console.log(`🚀 Server ready at ${server.graphqlPath}`);
	console.log(`🚀 Subscriptions ready at ${server.subscriptionsPath}`);
});
