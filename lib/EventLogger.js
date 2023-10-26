class EventLogger {

	constructor (emitter) {

		this.now = Date.now ()
						
		for (let o = this; o; o = Object.getPrototypeOf (o))
		
			for (const name of Object.getOwnPropertyNames (o))

				if (name.slice (-7) === 'Message') {

					const event = name.slice (0, -7), level = this.getLevel (event)
				
					emitter.on (event, payload => {

						let message = this [name] (payload)

						if (typeof message === 'string') message = {message}

						if (!('level' in message)) message.level = level
						
						const prefix = this.getPrefix (payload); if (prefix) message.message = prefix + ' ' + message.message

						this.logger.log (message)

					})

				}

	}

	getPrefix () {
		
		return ''

	}

	getLevel (event) {
		
		return event === 'error' ? event : 'info'

	}
		
	errorMessage (error) {

		if (!(error instanceof Error)) return '' + error

		return error.stack
			.split ('\n')
			.map (s => s.trim ())
			.join (' ')
			.trim ()
		
	}
	
	finishMessage () {

		return '< ' + (Date.now () - this.now) + ' ms'

	}
	
}

module.exports = EventLogger