const amqp = require('amqplib');
const fetch = require('node-fetch');
const logger = require('../../logger');
const config = require('../../../config.json');
const pubStream = require('./publicStream');
const privStream = require('./privateStream');

async function streams(pubsub) {
    let response = await fetch(`${config.peatioInternalURL || 'http://peatio:8000/api/v2/'}public/markets`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
        referrer: 'no-referrer',
        headers: {
            'User-Agent': 'Exchange/proxy',
            'Content-Type': 'application/json;charset=utf-8',
        }
    });
    if (response.ok) {
        const markets = await response.json();
        logger('INFO', 'Read markets list from server');
        const ex = 'peatio.events.ranger';
        logger('INFO', `AMQP connecting ...`);
        amqp.connect("amqp://rabbitmq:5672").then(function(conn) {
            conn.on('error', (err) => {
                console.log(err);
                logger('ERROR', [`When connect receive error`, err]);
            });
            conn.createChannel().then(function(channel) {
                channel.assertExchange('peatio.events.ranger', 'topic', {durable: false});
                logger('INFO', `create channel && assert peatio.events.ranger exchange`);
                return channel;
            }).then((channel) => {
                pubStream(channel, pubsub, markets);
            }).catch(err => {
                logger('ERROR', ['When create public channel & consume message', err]);
            });
            conn.createChannel().then(function(channel) {
                channel.assertExchange('peatio.events.market', 'direct', {durable: false});
                logger('INFO', `create channel && assert peatio.events.market exchange`);
                return channel;
            }).then((channel) => {
                privStream(channel, pubsub, markets);
            }).catch(err => {
                logger('ERROR', ['When create private channel & consume message', err]);
            });
        }).catch(err => {
            logger('ERROR', ['When try connect to RabbitMQ', err]);
        });
        return true;
    } else {
        logger('ERROR', ['When Fetch market for channels', response.error]);
        console.log(response);
        return false;
    }
}

module.exports = streams;
