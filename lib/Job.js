const EventEmitter = require ('events')
const {Tracker} = require ('events-to-winston')
const TODO = Symbol ('todo')
const TS = Symbol ('timestamps')
const MAX_LATENCY = Symbol ('maxLatency')
const MIN_LATENCY = Symbol ('minLatency')
const INSTANCE = Symbol ('instance')
const PAYLOAD = Symbol ('payload')
const {ModuleMap: {MODULE, MODULE_NAME, METHOD_NAME}} = require ('require-sliced')

class NotAnError extends Error {

	constructor (value, method) {

		value = String (value)
		
		const {length} = value; if (length < 32) {

			value = JSON.stringify (value)

		}
		else {

			value = `${JSON.stringify (value.slice (0, 32))}... (${length - 32} more)`

		}

		super (`Not an error thrown from ${method [MODULE] [MODULE_NAME]}.${method [METHOD_NAME]}, type: ${typeof value}, value: ${value}`)

	}

}

class CustomError extends Error {

	constructor (message, payload = {}) {

		super (message)

		this [PAYLOAD] = payload

		if (typeof payload === 'object' && payload !== null)
			
			for (const [k, v] of Object.entries (payload))
				
				this [k] = v

	}

}

class Job extends EventEmitter {

	static NotAnError = NotAnError
	static CustomError = CustomError

	static INSTANCE = INSTANCE
	static PAYLOAD = PAYLOAD

	constructor (request, options = {}) {
		
		super ()
		
		this.request = request

		if ('parent' in options) {

			const {parent} = options; if (!(parent instanceof Job)) throw Error ('`parent` must be a Job instance')

			this.parent = parent

		}

		this [TS] = {created: Date.now ()}

		this [MIN_LATENCY] = 0
		this [MAX_LATENCY] = Infinity
	
	}

	get [Tracker.LOGGING_PARENT] () {

		return this.parent ?? this.src

	}

	get [Tracker.LOGGING_ID] () {

		return this.id

	}

	get [Tracker.LOGGING_DETAILS] () {

		return this.src.getJobLoggingDetails (this)

	}

	setMinLatency (ms) {

		{

			const type = typeof ms

			if (type !== 'number') throw Error (`The job latency must be a number, not ${type}`)

		}

		if (ms < 0) throw Error (`The job latency cannot be negative (${ms})`)

		if (!Number.isSafeInteger (ms)) throw Error (`The job latency must be  a safe integer, not ${ms}.`)

		this [MIN_LATENCY] = ms

	}

	setMaxLatency (ms) {

		if (this [MAX_LATENCY] === ms) return

		{

			const type = typeof ms

			if (type !== 'number') throw Error (`The job latency must be a number, not ${type}`)

		}

		if (ms < 0) throw Error (`The job latency cannot be negative (${ms})`)

		if (!Number.isSafeInteger (ms)) throw Error (`The job latency must be  a safe integer, not ${ms}.`)

		this [MAX_LATENCY] = ms

	}

	waitFor (promise) {
	
		this [TODO].push (promise)
	
	}

	fail (error) {
	
		this.waitFor (new Promise (
		
			(ok, fail) => fail (error)
		
		))
	
	}
	
	async broadcast (event, payload) {

		this [TS] [event] = Date.now ()
	
		this [TODO] = []

		this.emit (event, payload)
		
		return Promise.all (this [TODO])
		
	}

	getTimeLeft (period) {
		
		return period - (Date.now () - this [TS].created)

	}

	expirationError () {

		return Error ('Timeout expired')

	}

	async callMethod () {

		const self = this, timeLeft = this.getTimeLeft (this [MAX_LATENCY]); if (timeLeft < 1) throw self.expirationError ()

		const process = this.method.call (this); if (timeLeft === Infinity) return process

		return new Promise ((ok, fail) => {

			const timeout = setTimeout (() => fail (self.expirationError ()), timeLeft)

			process.then (
				result => {clearTimeout (timeout); ok   (result)},
				reason => {clearTimeout (timeout); fail (reason)}
			)

		})
			
	}

	raise (message, payload) {

		throw new CustomError (message, payload)

	}

	async outcome () {

		const {src} = this

		try {

			await src.onJobInit (this)

			await this.broadcast ('init')

			const method = this.app.getMethod (this.request); if (method == null) return
			this.method = method
			this.module = method [MODULE]
	
			await this.broadcast ('start')
	
			this.result = await this.callMethod ()

			await this.broadcast ('end')

			await src.onJobEnd (this)

			return this.result

		}
		catch (something) {

			this.error = something instanceof Error ? something : new NotAnError (something, this.method)

			this.error [INSTANCE] = this

			await this.broadcast ('error', this.error)

			await src.onJobError (this)

			if (this.error === undefined) return undefined
			
			throw this.error

		}
		finally {

			await this.broadcast ('finish')

			const lag = this.getTimeLeft (this [MIN_LATENCY]), finish = () => this.emit ('next')

			if (lag < 1) {

				finish ()

			}
			else {

				setTimeout (finish, lag)

			}

		}

	}

	* resources (clazz) {

		for (const [k, v] of this.src.pools.entries ())
		
			if (v instanceof clazz)
			
				yield this [k]

	}

}

module.exports = Job