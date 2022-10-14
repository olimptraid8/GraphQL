function orderbookSerializer(msg) {
	return {
		marketUpdate: {
			asks: msg.asks.map((el) => {
				return { price: el[0], amount: el[1] };
			}),
			bids: msg.bids.map((el) => {
				return { price: el[0], amount: el[1] };
			})
		}
	};
}

module.exports = orderbookSerializer;
