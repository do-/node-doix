class Router {

	constructor () {
	
		this.destinations = []

	}
	
	add (destination) {
	
		this.destinations.push (destination)
		
		return this
	
	}

	process (message) {
	
		for (const destination of this.destinations) {

			if ('check' in destination && !destination.check (message)) continue
			
			destination.process (message)
			
			break

		}
	
	}

}

module.exports = Router