class EventLogger {

	constructor (emitter) {

		this.now = Date.now ()

		for (const name of Object.getOwnPropertyNames (Object.getPrototypeOf (this))) 

			if (name.slice (-7) === 'Message')

				emitter.on (name.slice (0, -7), (j, p) => 

					this.logger.log (this [name] (p))

				)

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
	
}

module.exports = EventLogger