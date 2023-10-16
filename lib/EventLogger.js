class EventLogger {

	constructor (emitter) {

		this.now = Date.now ()
						
		for (let o = this; o; o = Object.getPrototypeOf (o))
		
			for (const name of Object.getOwnPropertyNames (o))

				if (name.slice (-7) === 'Message')
				
					emitter.on (name.slice (0, -7), p => {

						this.logger.log (this [name] (p))

					})

	}

	errorToString (error) {

		if (!(error instanceof Error)) return '' + error

		return error.stack
			.split ('\n')
			.map (s => s.trim ())
			.join (' ')
			.trim ()

	}
	
	message (message, level = 'info') {
	
		const {prefix} = this
	
		if (prefix) message = prefix + ' ' + message
		
		return {level, message}
		
	}
	
	errorMessage (x) {

		return this.message (this.errorToString (x), 'error')
		
	}
	
	finishMessage () {

		return this.message ('< ' + (Date.now () - this.now) + ' ms')

	}
	
}

module.exports = EventLogger