const EventEmitter = require ('events')
const {Tracker} = require ('events-to-winston')

class Doser extends EventEmitter {

	#buf = []
	#maxSize = Infinity
	#interval = null
	#isStopped = false

	constructor (app, options = {}) {

		const {name, maxSize, interval} = options

        if (maxSize != null) {

            if (!Number.isSafeInteger (maxSize)) throw Error (`Invalid maxSize: ${maxSize}`)

            if (maxSize <= 0) throw Error (`Non-positive maxSize: ${maxSize}`)

        }

		if (interval != null) {

			const t = typeof interval; if (t !== 'number') throw new Error (`Invalid interval type: '${t}' (expected 'number')`)

			if (!Number.isSafeInteger || interval < 1 || interval > 2147483647) throw new Error (`Invalid interval value: ${interval}`)

		}

		super ()

		app.once ('finish', () => this.stop ())

		this.app = app
		this.name = name

		this.tracker = new Tracker (this, app.logger)
		this.tracker.listen ()

		if (maxSize) this.#maxSize = maxSize

		if (interval) this.#interval = setInterval (() => this.flush (), interval)

	}

	get size () {

		return this.#buf.length

	}

	get maxSize () {

		return this.#maxSize

	}

	push (data) {

		if (this.#isStopped) throw ('Stopped')

		this.#buf.push (data)

		this.emit ('+', data)

		if (this.#buf.length >= this.#maxSize) this.flush ()

	}

	flush () {

		if (this.#buf.length === 0) return

		this.emit ('data', this.#buf)

		this.#buf = []

	}

	stop () {

		if (this.#isStopped) return

		this.#isStopped = true

		clearInterval (this.#interval)

		this.flush ()

		this.emit ('finish')

	}

	pipe (dst) {

		this.on ('data', data => {

			try {

				dst.add ({data})

			}
			catch (err) {

				this.emit ('error', err)

			}

		})

		return dst

	}

	get [Tracker.LOGGING_ID] () {

		return this.name

	}

	get [Tracker.LOGGING_PARENT] () {

		return this.app

	}

	get [Tracker.LOGGING_EVENTS] () {

		return {

            '+': {
				level: 'info',
				details: request => ({size: this.size, maxSize: this.maxSize, request}),
            },

            'data': {
				level: 'info',
				details: data => ({size: this.size, maxSize: this.maxSize, data}),
            },
			
			'finish': {
				level: 'info',
            },

        }

	}

}

module.exports = Doser