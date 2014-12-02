import { DataBeam } from '..';
import { SocketServer } from './support/socket';

describe('DataBeam', () => {
	let srv = null;
	let testSrv = null;
	let client1 = null;
	let client2 = null;
	let client3 = null;
	let client4 = null;
	let magic = 27;
	beforeEach((done) => {
		srv = new SocketServer();
		testSrv = srv.of('/test');
		client1 = srv.connect({ multiplex: false });
		client2 = srv.connect({ multiplex: false });
		client3 = srv.connect({ multiplex: false });
		client4 = testSrv.connect();
		let connectted = 4;
		srv.io.on('connection', (socket) => {
			new DataBeam(socket);
			--connectted || done();
		});
		testSrv.io.on('connection', (socket) => {
			new DataBeam(socket);
		});
	});
	afterEach((done) => {
		client1.disconnect();
		client2.disconnect();
		client3.disconnect();
		client4.disconnect();
		srv.close();
		testSrv.close();
		done();
	});

	describe('events#broadcast', () => {
		it('should sends data to all connected clients when broadcast event triggered', (done) => {
			let total = 2;
			srv.listen(() => {
				client1.on('broadcast', (packet) => {
					done(new Error('done'));
				});
				client2.on('broadcast', (packet) => {
					packet.should.equal(magic);
					--total || done();
				});
				client3.on('broadcast', (packet) => {
					packet.should.equal(magic);
					--total || done();
				});
				client4.on('broadcast', (packet) => {
					done(new Error('not'));
				});

				client1.emit('broadcast', magic);
			});
		});
	});
});