/**
 * Module dependencies
 */
import { DataBeam } from './base';
const ObjectID = require('mongodb').ObjectID;

/**
 * Module exports
 */
export class MongoDataBeam extends DataBeam {
	/**
	 * MongoDataBeam constructor
	 * @param {socket.io} socket socket.io instance
	 * @param {mongodb.collection} collection mongodb collection
	 */
	constructor(socket, collection) {
		this.collection = collection;
		super(socket);
	}

	/**
	 * events initialize
	 */
	initialize() {
		super.initialize();
		let self = this;
		// socket.io based CRUD handler
		// create event
		this.socket.on('create', function (packet) {
			self.collection.insertOne(packet.data, (err, result) => {
				if (!!err) {
					this.emit('error', {
						event: 'create',
						data: err
					});
					return;
				}
				this.broadcast.emit('create', { data: result.ops[0] });
				this.emit('create', { data: result.ops[0] });
			});
		});

		// read event
		this.socket.on('read', function (packet) {
			if (!!packet.id) {
				self.collection.findOne({ _id: new ObjectID(packet.id) }, (err, doc) => {
					if (!!err) {
						this.emit('error', {
							event: 'read',
							data: err
						});
						return;
					}
					this.emit('read', { data: doc });
				});
			}
			else {
				self.collection.find().toArray((err, docs) => {
					if (!!err) {
						this.emit('error', {
							event: 'read',
							data: err
						});
						return;
					}
					this.emit('read', { data: docs });
				});
			}
		});

		// update event
		this.socket.on('update', function (packet) {
			self.collection.findOneAndUpdate({ _id: new ObjectID(packet.id) },
				{ $set: packet.data },
				{ returnOriginal: false },
				(err, result) => {
				if (!!err) {
					this.emit('error', {
						event: 'update',
						data: err
					});
					return;
				}
				this.broadcast.emit('update', { data: result.value });
			});
		});

		// delete event
		this.socket.on('delete', function (packet) {
			self.collection.findOneAndDelete({ _id: new ObjectID(packet.id) }, (err) => {
				if (!!err) {
					this.emit('error', {
						event: 'delete',
						data: err
					});
					return;
				}
				this.broadcast.emit('delete', { id: packet.id });
			});
		});
	}
}