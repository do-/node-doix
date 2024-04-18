const {randomUUID} = require ('crypto')
const EventEmitter = require ('events')
const JobSource = require ('./JobSource')

class Router extends EventEmitter {

	constructor () {
	
		super ()
		
		this.uuid = randomUUID ()
	
		this.destinations = []

	}
	
	add (destination) {
	
		this.destinations.push (destination)

		if (destination instanceof JobSource) destination.setRouter (this)
		
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