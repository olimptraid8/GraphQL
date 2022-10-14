const { gql } = require('apollo-server');

const order = gql`
	extend type Query {
		getOrderHistory(
			_barong_session: String!
			market: String
			state: String
			page: Int
			limit: Int
			order_by: OrderBy
			type: String
			ord_type: String
		): OrderHistory
	}

	extend type Subscription {
		userOrders(_barong_session: String, market: String): [Order]
	}

	extend type Mutation {
		createOrder(
			_barong_session: String!
			market: String!
			side: String!
			volume: Float!
			ord_type: String
			price: Float
		): Order
		cancelOrder(_barong_session: String!, order_id: Int!): Order
		cancelAllOrders(_barong_session: String!, market: String, side: String): [Order]
	}

	type Order {
		id: Int
		market: String
		marketName: String
		kind: String
		side: String
		ord_type: String
		price: String
		avg_price: String
		state: String
		origin_volume: String
		remaining_volume: String
		executed_volume: String
		at: Int
		created_at: Int
		updated_at: Int
		trades_count: Int
	}

	type OrderHistory {
		orders: [Order]
		page: Int
		total: Int
		perPage: Int
	}
`;

module.exports = order;
