/**
 * Module exports
 */

export class DataBeam {
	/**
	 * DataBeam contructor
	 */
	constructor(socket) {
		this.socket = socket;
		this.initialize();
	}

	/**
	 * events initialize
	 */
	initialize() {
		// broadcast event
		// broadcast data to all rest connected clients
		this.socket.on('broadcast', function (packet) {
			this.broadcast.emit('broadcast', packet);
		});
	}
}