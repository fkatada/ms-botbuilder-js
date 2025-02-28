const { SubscribableStream } = require('../lib/subscribableStream');
const { PayloadTypes, StreamManager } = require('../lib/payloads');
const { PayloadAssembler } = require('../lib/assemblers');
const { expect } = require('../vendors/chai');

const streamManager = new StreamManager();

describe('PayloadAssembler', function () {
    it('constructs correctly.', function () {
        const header = {
            payloadType: PayloadTypes.request,
            payloadLength: '42',
            id: '100',
            end: true,
        };
        const rra = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(rra.id).equals('100');
        expect(rra.streamManager).equals(streamManager);
    });

    it('closes without throwing', function () {
        const header = {
            payloadType: PayloadTypes.request,
            payloadLength: '42',
            id: '99',
            end: true,
        };
        const rra = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(() => {
            rra.close();
        }).to.not.throw();
    });

    it('returns a new stream.', function () {
        const header = {
            payloadType: PayloadTypes.response,
            payloadLength: '42',
            id: '100',
            end: true,
        };
        const rra = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(rra.createPayloadStream()).to.be.instanceOf(SubscribableStream);
    });

    it('processes a Request without throwing.', function (done) {
        const header = {
            payloadType: PayloadTypes.request,
            payloadLength: '5',
            id: '98',
            end: true,
        };
        const s = new SubscribableStream();

        s.write('12345');
        const rp = { verb: 'POST', path: '/some/path' };
        rp.streams = s;
        const rra = new PayloadAssembler(streamManager, {
            header,
            onCompleted: () => done(),
        });
        rra.onReceive(header, s, 5);
        rra.close();
    });

    it('processes a Response without throwing.', function (done) {
        const header = {
            payloadType: PayloadTypes.response,
            payloadLength: '5',
            id: '100',
            end: true,
        };
        const s = new SubscribableStream();

        s.write('12345');
        const rp = { statusCode: 200 };
        rp.streams = s;
        const rra = new PayloadAssembler(streamManager, {
            header,
            onCompleted: () => done(),
        });
        rra.onReceive(header, s, 5);
    });

    it('assigns values when constructed', function () {
        const header = {
            payloadType: PayloadTypes.stream,
            payloadLength: 50,
            id: '1',
            end: undefined,
        };
        const csa = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(csa.id).equals('1');
        expect(csa.contentLength).equals(50);
        expect(csa.payloadType).equals('S');
        expect(csa.end).equals(undefined);
    });

    it('returns a Stream', function () {
        const header = {
            payloadType: PayloadTypes.stream,
            payloadLength: 50,
            id: '1',
            end: true,
        };
        const csa = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(csa.createPayloadStream()).instanceOf(SubscribableStream);
    });

    it('closes a Stream', function () {
        const header = {
            payloadType: PayloadTypes.stream,
            payloadLength: 50,
            id: '97',
            end: true,
        };
        const csa = new PayloadAssembler(streamManager, { header, onCompleted: () => {} });

        expect(csa.createPayloadStream()).instanceOf(SubscribableStream);
        expect(() => csa.close()).to.not.throw();
    });

    it('throws if not given an ID', function () {
        const header = {
            payloadType: PayloadTypes.request,
            payloadLength: '5',
            id: undefined,
            end: true,
        };
        expect(() => new PayloadAssembler(streamManager, { header })).to.throw(
            'An ID must be supplied when creating an assembler.',
        );
    });

    it('processes a response with streams without throwing.', function (done) {
        const header = { payloadType: PayloadTypes.response, payloadLength: '5', id: '96', end: true };
        const s = new SubscribableStream();
        s.write(
            '{"statusCode": "12345","streams": [{"id": "1","contentType": "text","length": "2"},{"id": "2","contentType": "text","length": "2"},{"id": "3","contentType": "text","length": "2"}]}',
        );
        const rp = { verb: 'POST', path: '/some/path' };
        rp.streams = [];
        rp.streams.push(s);

        const rra = new PayloadAssembler(streamManager, {
            header: header,
            onCompleted: () => done(),
        });
        rra.onReceive(header, s, 5);
        rra.close();
    });
});
