const EventEmitter = require ('events')
const {Tracker} = require ('events-to-winston')
const TODO = Symbol ('todo')
const TS = Symbol ('timestamps')
const MAX_LATENCY = Symbol ('maxLatency')
const MIN_LATENCY = Symbol ('minLatency')

class Job extends EventEmitter {

	constructor (rq) {
		
		super ()
		
		this.rq = rq

		this [TS] = {created: Date.now ()}

		this [MIN_LATENCY] = 0
		this [MAX_LATENCY] = Infinity
	
	}

	get [Tracker.LOGGING_PARENT] () {

		return this.src

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

	async callMethod (method) {

		const self = this, timeLeft = this.getTimeLeft (this [MAX_LATENCY]); 
				
		if (timeLeft < 1) throw self.expirationError ()

		const process = method.call (this); if (timeLeft === Infinity) return process

		return new Promise ((ok, fail) => {

			const timeout = setTimeout (() => fail (self.expirationError ()), timeLeft)

			process.then (
				result => {clearTimeout (timeout); ok   (result)},
				reason => {clearTimeout (timeout); fail (reason)}
			)

		})
			
	}

	async outcome () {

		try {

			await this.broadcast ('start')

			const {app} = this, {methodSelector} = app

			const moduleName = methodSelector.getModuleName (this); 
			
			if (moduleName === null) return

			this.module = app.modules.get (moduleName)

			await this.broadcast ('module')

			const methodName = methodSelector.getMethodName (this)

			if (!(methodName in this.module)) throw Error ('Method "' + methodName + '" not found in "' + moduleName + '" module')

			await this.broadcast ('method', methodName)

			const method = this.module [methodName]

			this.result = await this.callMethod (method)

			await this.broadcast ('end')

			return this.result

		}
		catch (error) {

			this.error = error

			await this.broadcast ('error', error)

			if (this.error === undefined) return undefined
			
			throw error

		}
		finally {

			await this.broadcast ('finish')

			const lag = this.getTimeLeft (this [MIN_LATENCY]), finish = () => this.emit ('finished')

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