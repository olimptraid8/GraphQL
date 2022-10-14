const logger = require('../../logger');
const klinePeriods = require('../../serializers/klinePeriods');
const klineSerializer = require('../../serializers/klineSerializer');
const orderbookSerializer = require('../../serializers/orderbookSerializer');
const tradesSerializer = require('../../serializers/tradesSerializer');
const dataSources = require('./');

async function publicSubscriptions(ch, pubsub, markets) {
    const marketUpdates = {};
    const sequences = {};
    const keys = ['public.global.tickers'];
    let al = 0;
    markets.map(market => {
        marketUpdates[market] = {asks: [], bids: []};
        sequences[market] = false;
        keys.push(`public.${market.id}.trades`);
        keys.push(`public.${market.id}.update`);
        keys.push(`public.${market.id}.ob-inc`);
        keys.push(`public.${market.id}.ob-snap`);
        Object.keys(klinePeriods).map(key => keys.push(`public.${market.id}.kline-${key}`));
    });
    const ex = 'peatio.events.ranger';
    ch.assertQueue('', {exclusive: true}).then((q)=>{
        keys.forEach(key => {
            ch.bindQueue(q.queue, ex, key);
            logger('INFO', `${key} asserted.`);
            ch.prefetch(1);
            ch.consume(q.queue, function(msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    try {
                        const keyNames = msg.fields.routingKey.split('.');
                        const chName = keyNames[2];
                        const market = keyNames[1];
                        let pubMessage;
                        switch (chName) {
                            case 'ob-snap':
                                sequences[market] = message.sequence;
                                marketUpdates[market] = orderbookSerializer(message).marketUpdate;
                                pubsub.publish(`${market}.update`, {marketUpdate: marketUpdates[market]});
                                break;
                            case 'ob-inc':
                                if (sequences[market] && sequences[market] > 0 && sequences[market] < message.sequence) {
                                    sequences[market] = message.sequence;
                                    let newBids = [];
                                    let newAsks = [];
                                    if (message.bids && message.bids.length > 1) {
                                        let isBidFound = false;
                                        let oldBids = (marketUpdates[market] && marketUpdates[market].bids) ? marketUpdates[market].bids : [];
                                        for (let i = 0; i < oldBids.length; i++) {
                                            if (oldBids[i].price === message.bids[0]) {
                                                isBidFound = true;
                                                if (message.bids[1] !== '') {
                                                    newBids.push({price: message.bids[0], amount: message.bids[1]})
                                                }
                                            } else {
                                                newBids.push(oldBids[i]);
                                            }
                                        };
                                        if (!isBidFound && message.bids[1] !== '') {
                                            newBids =
                                                [...oldBids, {price: message.bids[0], amount: message.bids[1]}].sort((a, b) => (b.price - a.price));
                                        }
                                    } else {
                                        if (message.bids) {
                                            logger('ERROR', ['Bids malformed', message.bids])
                                        } else {
                                            newBids = (marketUpdates[market] && marketUpdates[market].bids) ? marketUpdates[market].bids : [];
                                        }
                                    }
                                    if (message.asks && message.asks.length > 1) {
                                        let isAskFound = false;
                                        let oldAsks = (marketUpdates[market] && marketUpdates[market].asks) ? marketUpdates[market].asks : [];
                                        for (let i = 0; i < oldAsks.length; i++) {
                                            if (oldAsks[i].price === message.asks[0]) {
                                                isAskFound = true;
                                                if (message.asks[1] !== '') {
                                                    newAsks.push({price: message.asks[0], amount: message.asks[1]})
                                                }
                                            } else {
                                                newAsks.push(oldAsks[i]);
                                            }
                                        };
                                        if (!isAskFound && message.asks[1] !== '') {
                                            newAsks =
                                                [...oldAsks, {price: message.asks[0], amount: message.asks[1]}].sort((a, b) => (a.price - b.price));
                                        }
                                    } else {
                                        if (message.asks) {
                                            logger('ERROR', ['Asks malformed', message.asks])
                                        } else {
                                            newAsks = (marketUpdates[market] && marketUpdates[market].asks) ? marketUpdates[market].asks : [];
                                        }
                                    }
                                    marketUpdates[market] = {asks: newAsks, bids: newBids};
                                    pubsub.publish(`${market}.update`, {marketUpdate: marketUpdates[market]});
                                } else {
                                    dataSources.peatioAPI.depth(market).then(depth => {
                                        marketUpdates[market] = depth;
                                        pubsub.publish(`${market}.update`, {marketUpdate: marketUpdates[market]});
                                        sequences[market] = 1;
                                    });
                                }
                                break;
                            case 'update':
                                pubsub.publish(`${market}.update`, orderbookSerializer(message));
                                break;
                            case 'trades':
                                pubMessage = tradesSerializer(message);
                                pubsub.publish(`${market}.trades`, pubMessage);
                                break;
                            case 'tickers':
                                pubMessage = {
                                    globalTickers: Object.keys(message).map(el => {
                                        return {id: el, ...message[el]};
                                    })
                                };
                                pubsub.publish(`globalTickers`, pubMessage);
                                break;
                            default:
                                const period = chName.split('-')[1];
                                pubMessage = klineSerializer(message);
                                pubsub.publish(`${market}.kline-${klinePeriods[period]}`, pubMessage);
                                break;
                        }
                    } catch (err) {
                        logger('ERROR', ['When serialize', message, err.toString()]);
                    }
                } catch (err) {
                    logger('ERROR', ['When parsing message']);
                }
            }, {noAck: true});
        });
    }).catch(err=>{
        logger('ERROR', ['When AMQP assert queue public', err]);
    });
}

module.exports = publicSubscriptions;
