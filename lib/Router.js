const EventEmitter = require ('events')
const winston      = require ('winston')
const {Tracker}    = require ('events-to-winston')

class Router extends EventEmitter {

	constructor (o) {		

		if (o == null) throw Error ('Options not set')
		if (typeof o !== 'object') throw Error ('Options set must be an object')

		if (typeof o.name !== 'string') throw Error ('Router name must be a string')
		if (o.name === '') throw Error ('Router name must not be empty')

		if (o.logger == null) throw Error ('`logger` not set')
		if (!(o.logger instanceof winston.Logger)) throw Error ('the `logger` option must be a winston.Logger')

		super ()

		for (const k of ['name', 'logger']) this [k] = o [k]
	
		this.destinations = []

		this.tracker = new Tracker (this, this.logger)

		this.tracker.listen ()

	}

	get [Tracker.LOGGING_ID] () {

		return this.name

	}

	get [Tracker.LOGGING_EVENTS] () {

		return {

			start: {
				level: 'info',
				details: {},
			},

			finish: {
				level: 'info',
			},

		}

	}
	
	add (destination) {
	
		this.destinations.push (destination)

		destination.router = this

		{

			const {LOGGING_PARENT} = Tracker

			delete destination [LOGGING_PARENT]

			destination [LOGGING_PARENT] = this

		}
		
		return this
	
	}

	process (message) {
	
		try {

			for (const destination of this.destinations) {

				if ('test' in destination && !destination.test (message)) continue

				destination.process (message)

				break

			}

		}
		catch (x) {
		
			this.emit ('error', x)
		
		}
	
	}
	
	listen () {
	
		for (const destination of this.destinations) 
		
			if (destination instanceof EventEmitter && destination.listenerCount ('error') === 0)

				destination.on ('error', (y, x) => this.emit ('error', x || y))

	}

}

module.exports = Router