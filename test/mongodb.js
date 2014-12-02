import { MongoDataBeam } from '..';
import { SocketServer } from './support/socket';
const mongodb = require('mongodb');

describe('MongoDataBeam', () => {
	let srv = null;
	let testSrv = null;
	let client1 = null;
	let client2 = null;
	let client3 = null;
	let client4 = null;
	let mdb = null;
	let collection = null;
	before((done) => {
		mongodb.MongoClient.connect('mongodb://localhost:27017/test', (err, db) => {
			if (err) done(err);
			mdb = db;
			collection = mdb.collection('MongoDataBeam');
			done();
		});
	});
	beforeEach((done) => {
		srv = new SocketServer();
		testSrv = srv.of('/test');
		client1 = srv.connect({ multiplex: false });
		client2 = srv.connect({ multiplex: false });
		client3 = srv.connect({ multiplex: false });
		client4 = testSrv.connect();
		let connectted = 4;
		srv.io.on('connection', (socket) => {
			new MongoDataBeam(socket, collection);
			--connectted || done();
		});
		testSrv.io.on('connection', (socket) => {
			new MongoDataBeam(socket, collection);
		});
	});
	afterEach((done) => {
		collection.remove();
		client1.disconnect();
		client2.disconnect();
		client3.disconnect();
		client4.disconnect();
		srv.close();
		testSrv.close();
		done();
	});
	after((done) => {
		mdb.dropDatabase((err, result) => {
			mdb.close(done);
		});
	});

	describe('events#create', () => {
		it('should create new object and emit it to all connected clients', (done) => {
			let data = { created: true };
			let total = 3;
			let verify = (id) => {
				let oid = mongodb.ObjectID(id);
				collection.findOne({ _id: oid }, (err, doc) => {
					if (err) done(err);
					doc.should.have.property('_id', oid);
					doc.created.should.be.ok;
					done();
				});
			};
			let handler = (packet) => {
				packet.data.should.have.property('_id');
				packet.data.created.should.be.ok;
				--total || verify(packet.data._id);
			};
			client1.on('create', handler);
			client2.on('create', handler);
			client3.on('create', handler);
			client4.on('create', (packet) => {
				done(new Error('wrog scope'));
			});
			client1.emit('create', { data: data });
		});
	});

	describe('events#read', () => {
		it('should get object with the specsific id returned', (done) => {
			let data = { read: true };
			collection.insertOne(data, (err, result) => {
				if (!!err) done(err);
				let rec = result.ops[0];
				client1.on('read', (packet) => {
					packet.data.should.have.property('_id', rec._id.toString());
					packet.data.read.should.be.ok;
					done();
				});
				client2.on('read', (packet) => {
					done(new Error('should not be here'));
				});
				client1.emit('read', { id: rec._id });
			});
		});

		it('should get all objects in collection returned without providing id', (done) => {
			let data = [{ read: 1 }, { read: 2 }, { read: 3 }];
			collection.insert(data, (err, result) => {
				if (!!err) done(err);
				let recs = result.ops;
				client1.on('read', (packet) => {
					packet.should.have.property('data').with.lengthOf(3);
					packet.data[0].should.have.property('_id');
					packet.data[0].should.have.property('read', 1);
					packet.data[1].should.have.property('read', 2);
					packet.data[2].should.have.property('read', 3);
					done();
				});
				client2.on('read', (packet) => {
					done(new Error('should not be here'));
				});
				client1.emit('read', {});
			});
		});
	});
	
	describe('events#update', () => {
		it('should have object updated and send new object to all rest connected clients', (done) => {
			let data = {
				magic: 27,
				updated: false
			};
			let total = 2;
			collection.insertOne(data, (err, result) => {
				if (!!err) done(err);
				let rec = result.ops[0];
				let verify = (id) => {
					let oid = mongodb.ObjectID(id);
					collection.findOne({ _id: oid }, (err, doc) => {
						if (!!err) done(err);
						doc.should.have.property('_id', oid);
						doc.updated.should.be.ok;
						doc.magic.should.equal(27);
						done();
					});
				};
				let handler = (packet) => {
					packet.data.should.have.property('_id', rec._id.toString());
					packet.data.updated.should.be.ok;
					packet.data.magic.should.equal(27);
					--total || verify(packet.data._id);
				};
				client1.on('update', (packet) => {
					done(new Error('should not be here'));
				});
				client2.on('update', handler);
				client3.on('update', handler);
				client4.on('update', (packet) => {
					done(new Error('wrog scope'));
				});
				client1.emit('update', {
					id: rec._id,
					data: { updated: true }
				});
			});
		});
	});
	
	describe('events#delete', () => {
		it('should have object deleted and send delete event to all rest connected clients', (done) => {
			let data = { deleted: false };
			let total = 2;
			collection.insertOne(data, (err, result) => {
				if (err) done(err);
				let rec = result.ops[0];
				let verify = (id) => {
					let oid = mongodb.ObjectID(id);
					collection.findOne({ _id: oid }, (err, doc) => {
						if (!!err) done(err);
						(doc === null).should.be.ok;
						done();
					});
				};
				let handler = (packet) => {
					packet.should.have.property('id', rec._id.toString());
					--total || verify(packet.id);
				};
				client1.on('delete', (packet) => {
					done(new Error('should not be here'));
				});
				client2.on('delete', handler);
				client3.on('delete', handler);
				client4.on('delete', (packet) => {
					done(new Error('wrog scope'));
				});
				client1.emit('delete', { id: rec._id });
			});
		});
	});
});