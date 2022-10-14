const { gql } = require('apollo-server');
const { Upload } = require('graphql-upload');

const typeDefs = gql`
	enum Topic {
		ALL
		SESSION
		OTP
		PASSWORD
	}

	enum OrderBy {
		ASC
		DESC
	}

	type Query {
		currencies: [Currency]
		markets(search: String): [Market]
		trades(market: String): [Trade]
		kLine(market: String, period: Int, time_from: Int, time_to: Int): [KCandle]
		balances(_barong_session: String): [Balance]
		userWithProfile(_barong_session: String): User
		userOrders(
			_barong_session: String
			market: String
			state: String
			limit: Int
			page: Int
			order_by: String
			order_type: String
			type: String
		): [Order]
		userTrades(
			_barong_session: String
			market: String
			limit: Int
			page: Int
			time_from: Int
			time_to: Int
			order_by: String
		): [Trade]
		getPhones(_barong_session: String!): [Phone]
		getDepositAddress(_barong_session: String!, currency: String!): DepositAddress
		getBeneficiaries(_barong_session: String!, currency: String): [Beneficiary]
		getDepositHistory(
			_barong_session: String!
			currency: String
			state: String
			limit: Int
			page: Int
		): DepositHistory
		getWithdrawHistory(_barong_session: String!, currency: String, limit: Int, page: Int): WithdrawHistory
		getActivityHistory(_barong_session: String!, topic: Topic!, page: Int, limit: Int): ActivityHistory
		getTradeHistory(
			_barong_session: String!
			market: String
			page: Int
			limit: Int
			order_by: OrderBy
			time_from: Int
			time_to: Int
		): TradeHistory
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

	type TradeHistory {
		trades: [Trade]
		page: Int
		total: Int
		perPage: Int
	}

	type OrderHistory {
		orders: [Order]
		page: Int
		total: Int
		perPage: Int
	}

	type DepositAddress {
		currency: String
		address: String
	}

	type AskBid {
		amount: String
		price: String
	}

	type OrderBook {
		asks: [AskBid]
		bids: [AskBid]
	}

	type Subscription {
		globalTickers: [Ticker]
		marketUpdate(market: String): OrderBook
		marketTrades(market: String): [Trade]
		marketKLine(market: String, interval: Int): [KCandle]
		userOrders(_barong_session: String, market: String): [Order]
		userTrades(_barong_session: String, market: String): [Trade]
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

	type Ticker {
		id: String
		name: String
		base_unit: String
		quote_unit: String
		low: Float
		high: Float
		last: Float
		at: Int
		open: Float
		volume: Float
		sell: Float
		buy: Float
		avg_price: Float
		price_change_percent: String
	}

	type Trade {
		id: ID
		price: Float
		amount: Float
		total: Float
		created_at: Int
		taker_type: String
		side: String
		order_id: Int
		fee_currency: String
		fee: Float
		fee_amount: Float
		market: String
		marketName: String
	}

	type KCandle {
		at: Int
		o: Float
		h: Float
		l: Float
		c: Float
		v: Float
	}

	type SimpleResponse {
		data: String
	}

	type File {
		filename: String!
		mimetype: String!
		encoding: String!
	}

	type Mutation {
		login(email: String!, password: String!, otp_code: String): User
		logout(_barong_session: String!): SimpleResponse
		askResetPassword(email: String!, lang: String): SimpleResponse
		emailConfirm(token: String!, lang: String): SimpleResponse
		resetPassword(
			reset_password_token: String!
			password: String!
			confirm_password: String!
			lang: String
		): SimpleResponse
		askEmailConfirm(email: String!, lang: String): SimpleResponse
		createUser(
			email: String!
			password: String!
			refid: String
			captcha_response: String
			data: String
			lang: String
		): User
		askQRCodeOTP(_barong_session: String!): Barcode
		enableOTP(_barong_session: String!, code: String!): SimpleResponse
		disableOTP(_barong_session: String!, code: String!): SimpleResponse
		addPhone(_barong_session: String!, phone_number: String!): SimpleResponse
		askPhoneCode(_barong_session: String!, phone_number: String!): SimpleResponse
		verifyPhone(_barong_session: String!, phone_number: String!, verification_code: String!): SimpleResponse
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
		addBeneficiaryCoin(
			_barong_session: String!
			currency: String!
			address: String!
			name: String!
			description: String
		): Beneficiary
		addBeneficiaryFiat(
			_barong_session: String!
			currency: String!
			full_name: String!
			account_number: String
			bank_name: String
			bank_swift_code: String
			intermediary_bank_name: String
			intermediary_bank_swift_code: String
			name: String!
			description: String
		): Beneficiary
		activateBeneficiary(_barong_session: String!, id: Int!, pin: String!): Beneficiary
		createWithdrawal(
			_barong_session: String!
			otp: String!
			beneficiary_id: Int!
			currency: String!
			amount: Float!
			note: String
		): Withdrawal
		changePassword(
			_barong_session: String!
			old_password: String!
			new_password: String!
			confirm_password: String!
		): SimpleResponse
		saveProfile(
			_barong_session: String!
			first_name: String
			last_name: String
			dateOfBirth: String
			address: String
			postcode: String
			city: String
			country: String
			metadata: String
		): Profile
		# resendPhone(phone_number: String!, channel: String): SimpleResponse
		# verifyPhone(phone_number: String!, verification_code: String!): SimpleResponse
		# uploadDocument(doc_type: String!, doc_number: String!, upload: Upload!, doc_expire: String, metadata: String): SimpleResponse
		uploadKYCDocument(
			_barong_session: String!
			doc_type: String!
			doc_number: String!
			upload: Upload!
			doc_expire: String!
			metadata: String
		): SimpleResponse
	}

	type Beneficiary {
		id: Int
		currency: String
		name: String
		address: String
		full_name: String
		account_number: String
		bank_name: String
		bank_swift_code: String
		intermediary_bank_name: String
		intermediary_bank_swift_code: String
		description: String
		state: String
	}

	type Deposit {
		id: String
		currency: String
		amount: Float
		fee: Float
		txid: String
		confirmations: Int
		state: String
		created_at: String
		completed_at: String
	}

	type DepositHistory {
		page: Int
		total: Int
		perPage: Int
		deposits: [Deposit]
	}

	type Withdrawal {
		id: Int
		currency: String
		type: String
		amount: Float
		fee: Float
		blockchain_txid: String
		rid: String
		state: String
		confirmations: Int
		note: String
		created_at: Int
		updated_at: Int
		done_at: Int
	}

	type WithdrawHistory {
		page: Int
		total: Int
		perPage: Int
		withdraws: [Withdrawal]
	}

	type Activity {
		id: Int
		user_id: Int
		target_uid: String
		category: String
		user_ip: String
		user_agent: String
		topic: String
		action: String
		result: String
		data: String
		created_at: String
	}

	type ActivityHistory {
		page: Int
		total: Int
		perPage: Int
		activities: [Activity]
	}

	type Barcode {
		barcode: String
		url: String
	}

	type ERC20Config {
		erc20_contract_address: String
		gas_limit: Int
		gas_price: Int
	}

	type Currency {
		id: ID
		name: String
		symbol: String
		explorer_transaction: String
		explorer_address: String
		type: String
		deposit_enabled: Boolean
		withdrawal_enabled: Boolean
		deposit_fee: Float
		min_deposit_amount: Float
		withdraw_fee: Float
		min_withdraw_amount: Float
		withdraw_limit_24h: Float
		withdraw_limit_72h: Float
		base_factor: String
		precision: Int
		position: Int
		icon_url: String
		options: ERC20Config
		min_confirmations: Int
	}

	type Market {
		id: ID
		name: String
		base_unit: Currency
		quote_unit: Currency
		min_price: Float
		max_price: Float
		min_amount: Float
		amount_precision: Int
		price_precision: Int
		state: String
		ticker: Ticker
	}

	type Balance {
		currency: Currency
		balance: Float
		locked: Float
	}

	type Label {
		key: String!
		value: String
		scope: String
	}

	type User {
		uid: String!
		email: String!
		role: String
		level: Int
		otp: Boolean
		state: String
		referral_uid: String
		labels: [Label]
		_barong_session: String
		_barong_session_expires: String
		data: String
		created_at: String
		updated_at: String
		phones: [Phone]
		profile: Profile
	}

	type Phone {
		country: String
		number: String
		validated_at: String
	}

	type Profile {
		first_name: String
		last_name: String
		dob: String
		address: String
		postcode: String
		city: String
		country: String
		state: String
		metadata: String
	}
`;

module.exports = typeDefs;
