/**
 * Module dependencies
 */
const http = require('http').Server;
const ios = require('socket.io');
const ioc = require('socket.io-client');

/**
 * Module exports
 */
export class SocketServer {
	/**
	 * SocketServer constructor
	 * @param {http.Server} srv http server instance
	 * @param {socket.io} io socket.io instance
	 * @param {String} nsp socket.io namespace
	 */
	constructor(srv, io, nsp) {
		this.httpServer = srv;
		this.io = io;
		if (!this.httpServer) this.httpServer = http();
		if (!this.io) this.io = ios(this.httpServer);
		if (!!nsp) this.io = this.io.of(nsp);

		let addr = this.httpServer.address();
		if (!addr) addr = this.httpServer.listen().address();
		this.url = 'ws://localhost:' + addr.port + (nsp || '');
	}

	/**
	 * http listen
	 * @param {Function} handler server handler
	 */
	listen(handler) {
		this.httpServer.listen(handler);
	}

	close() {
		this.httpServer.close();
	}

	/**
	 * new instance with namespace
	 * @param {String} nsp socket.io namespace
	 * @return {SocketServer} instance
	 */
	of(nsp) {
		return new SocketServer(this.httpServer, this.io, nsp);
	}

	/**
	 * get socket.io-client instance connected to server
	 * @param {Object} opts socket.io-client options
	 * @return {socket.io-client} instance
	 */
	connect(opts) {
		return ioc(this.url, opts);
	}
}