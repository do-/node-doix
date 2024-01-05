const {normalizeSpace} = require ('string-normalize-space')

class LifeCycleTracker {

	constructor (emitter, logger) {

		const already = new Set ()

		for (let o = this; o; o = Object.getPrototypeOf (o))

			for (const name of Object.getOwnPropertyNames (o))

				if (name.slice (-7) === 'Message') {

					const event = name.slice (0, -7)
					
					if (already.has (event)) continue

					already.add (event)
					
					const level = this.getLevel (event)

					emitter.on (event, payload => {

						let message = this [name] (payload)

						if (typeof message === 'string') message = {message}

						if (!('level' in message)) message.level = level

						const {prefix} = this; if (prefix) message.message = prefix + ' ' + message.message

						message.message = normalizeSpace (message.message)

						logger.log (message)

					})

				}

	}

	getLevel (event) {
		
		return event === 'error' ? event : 'info'

	}

	startMessage () {

		this.start = Date.now ()
	
		return '>'
		
	}

	finishMessage () {

		return '< ' + (Date.now () - this.start) + ' ms'

	}

	errorMessage (error) {

		if (!(error instanceof Error)) return '' + error

		return error.stack
			.split ('\n')
			.map (s => s.trim ())
			.join (' ')
			.trim ()

	}

}

module.exports = LifeCycleTracker