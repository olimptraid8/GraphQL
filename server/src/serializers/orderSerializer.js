const orderSerializer = function(message) {
	const base_unit = message.market.substr(0, 3);
	const ov = message.income_unit == base_unit ? message.initial_income_amount : message.initial_outcome_amount;
	var v = message.income_unit == base_unit ? message.current_income_amount : message.current_outcome_amount;
	return {
		id: message.id,
		market: message.market,
		side: message.type,
		created_at: Number((new Date(message.created_at).getTime() / 1000).toFixed(0)),
		ord_type: message.strategy,
		price: message.price,
		state: message.state,
		remaining_volume: v,
		origin_volume: ov,
		trades_count: message.trades_count,
		executed_volume: ov - v,
		trades_count: message.trades_count
	};
};

module.exports = orderSerializer;
