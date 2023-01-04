class EventLogger {

	constructor (emitter) {

		this.now = Date.now ()

		for (const name of Object.getOwnPropertyNames (Object.getPrototypeOf (this))) 

			if (name.slice (-7) === 'Message')

				emitter.on (name.slice (0, -7), (j, p) => 

					this.logger.log (this [name] (p))

				)

	}
	
	message (message, level = 'info') {
	
		const {prefix} = this
	
		if (prefix) message = prefix + ' ' + message
		
		return {level, message}
		
	}
	
}

module.exports = EventLogger