function tradesSerializer(msg) {
	return {
		marketTrades: msg.trades.map((trade) => {
			return {
				id: trade.tid,
				taker_type: trade.taker_type,
				created_at: Number(trade.date),
				price: trade.price,
				total: Number(trade.price) * Number(trade.amount),
				amount: trade.amount,
				side: trade.taker_type
			};
		})
	};
}

module.exports = tradesSerializer;
