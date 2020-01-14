import * as amqp from 'amqplib'

describe('', function() {
    let mq: amqp.Connection;

    beforeAll(async function() {
        mq = await amqp.connect('amqp://user:pass@localhost:5672');
    });
    afterAll(async function() {
        await mq.close();
    });
    it('sub/pub', async function() {
        const ch = await mq.createChannel();
        const q = 'my-queue';
        await ch.assertQueue(q);
        const job = new Promise<amqp.ConsumeMessage>(function(done, fail) {
            ch.consume(q, function(message) {
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