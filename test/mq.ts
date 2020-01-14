import * as amqp from 'amqplib'
import * as mqtt from 'mqtt'

describe('amqp', function () {
    let mq: amqp.Connection;

    beforeAll(async function () {
        mq = await amqp.connect('amqp://user:pass@localhost:5672');
    });
    afterAll(async function () {
        await mq.close();
    });
    it('sub/pub', async function () {
        const ch = await mq.createChannel();
        const q = 'my-queue';
        await ch.assertQueue(q);
        const job = new Promise<amqp.ConsumeMessage>(function (done, fail) {
            ch.consume(q, function (message) {
                if (!message) {
                    fail(new Error('empty message'));
                } else {
                    ch.ack(message);
                    done(message);
                }
            });
        });
        const body = 'this is a text';
        ch.sendToQueue(q, Buffer.from(body));
        const res = await job;
        expect(res.content.toString()).toBe(body);
    });
});
describe('mqtt', function () {
    let mq: mqtt.Client;

    beforeAll(function (done) {
        mq = mqtt.connect('mqtt://user:pass@localhost:1883').once('connect', function () {
            done();
        }).once('error', done);
    });
    afterAll(function (done) {
        mq.end(false, undefined, done);
    });
    it('sub/pub', async function () {
        const topic = 'my-queue';
        const job = new Promise<{
            topic: string
            payload: Buffer
        }>(function (done, fail) {
            mq.subscribe(topic, function (e) {
                e ? fail(e) : mq.once('message', function (topic, payload) {
                    done({
                        topic,
                        payload,
                    });
                });
            });
        });
        const body = 'this is a MQTT message';
        await new Promise<void>(function (done, fail) {
            mq.publish(topic, body, function (e) {
                e ? fail(e) : done();
            });
        });
        const res = await job;
        expect(res.topic).toBe(topic);
        expect(res.payload.toString()).toBe(body);
    });
});