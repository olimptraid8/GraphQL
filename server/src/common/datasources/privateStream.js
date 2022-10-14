const base64 = require('base-64');
const logger = require('../../logger');
const orderSerializer = require('../../serializers/orderSerializer');

const queues = [
    {
        key: 'order_created',
        uidName: ['trader_uid'],
        serialize: function(message, market) {
            var result = orderSerializer(message);
            result.updated_at = Number((new Date(message.created_at).getTime() / 1000).toFixed(0));
            result.state = 'wait';
            result.marketName = market.name;
            return {userOrders: [result]};
        },
        pubTo: 'order'
    },
    {
        key: 'order_completed',
        uidName: ['trader_uid'],
        serialize: function(message, market) {
            var result = orderSerializer(message);
            result.updated_at = Number((new Date(message.completed_at).getTime() / 1000).toFixed(0));
            result.state = 'done';
            result.marketName = market.name;
            result.price = result.avg_price;
            return {userOrders: [result]};
        },
        pubTo: 'order'
    },
    {
        key: 'order_canceled',
        uidName: ['trader_uid'],
        serialize: function(message, market) {
            var result = orderSerializer(message);
            result.updated_at = Number((new Date(message.canceled_at).getTime() / 1000).toFixed(0));
            result.state = 'cancel';
            result.price = result.ord_type === 'market' ? result.avg_price : result.price;
            result.marketName = market.name;
            return {userOrders: [result]};
        },
        pubTo: 'order'
    },
    {
        key: 'order_updated',
        uidName: ['trader_uid'],
        serialize: function(message, market) {
            var result = orderSerializer(message);
            result.state = 'wait';
            result.marketName = market.name;
            if (result.ord_type === 'market') {
                result.price = result.avg_price;
            }
            result.updated_at = Number((new Date(message.updated_at).getTime() / 1000).toFixed(0));
            return {userOrders: [result]};
        },
        pubTo: 'order'
    },
    {
        key: 'trade_completed',
        uidName: ['maker_uid', 'taker_uid'],
        serialize: function(message, market, userType) {
            // console.log(message, market, userType);
            if (userType === 'maker_uid') {
                const sideMaker = (market.base_unit === message.maker_income_unit) ? 'buy': 'sell';
                return {userTrades: [
                    {
                        id: message.id,
                        price: message.price,
                        amount: (market.base_unit === message.maker_income_unit) ? message.maker_income_amount : message.maker_outcome_amount,
                        total: (market.base_unit === message.maker_income_unit) ? message.maker_outcome_amount : message.maker_income_amount,
                        side: sideMaker,
                        marketName: market.name,
                        taker_type: sideMaker === 'buy' ? 'sell' : 'buy',
                        created_at: Number((new Date(message.completed_at).getTime() / 1000).toFixed(0)),
                        market: message.market,
                        fee_amount: message.maker_income_fee,
                        fee_currency: message.maker_income_unit
                    },
                ]};
            } else {
                const sideTaker = (market.base_unit === message.taker_income_unit) ? 'buy': 'sell';
                return {userTrades: [{
                    id: message.id,
                    price: message.price,
                    amount: (market.base_unit === message.taker_income_unit) ? message.taker_income_amount : message.taker_outcome_amount,
                    total: (market.base_unit === message.taker_income_unit) ? message.taker_outcome_amount : message.taker_income_amount,
                    side: sideTaker,
                    taker_type: sideTaker,
                    marketName: market.name,
                    created_at: Number(((new Date(message.completed_at)).getTime() / 1000).toFixed(0)),
                    market: message.market,
                    fee_amount: message.maker_income_fee,
                    fee_currency: message.maker_income_unit
                }]};
            }
        },
        pubTo: 'trade'
    }
]

async function privateStream(ch, pubsub, markets) {
    const ex = 'peatio.events.market';
    markets.forEach(market => {
        queues.forEach(queue => {
            const routingKey = `${market.id}.${queue.key}`;
            ch.assertQueue(routingKey, {auto_delete: true, durable: true}).then((q)=>{
                ch.bindQueue(q.queue, ex, routingKey);
                logger('INFO', `${routingKey} asserted.`);
                ch.prefetch(1);
                ch.consume(q.queue, function(msg) {
                    try {
                        var message = JSON.parse(base64.decode(JSON.parse(msg.content.toString()).payload)).event;
                        queue['uidName'].map(el => {
                            const result = queue.serialize(message, market, (queue.key === 'trade') ? el : null);
                            pubsub.publish(`${queue.pubTo}.${message[el]}.${message['market']}`, result);
                        });
                    } catch(errorParse) {
                        logger('ERROR', ['When parse private message', msg, errorParse]);
                    } 
                }, {noAck: true, exclusive: false});
            }).catch(err=>{
                logger('ERROR', ['When AMQP assert queue private', err]);
            });
        });
    });
}

module.exports = privateStream;