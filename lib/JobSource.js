const EventEmitter = require ('events')
const winston = require ('winston')
const {Tracker} = require ('events-to-winston')
const Lag = require ('./Lag')
const Application = require ('./Application')
const Job = require ('./Job.js')

const {ObjectMerger} = require ('subclassable-object-merger')
const OM = new ObjectMerger ({override: ['scalar']})

class JobSource extends EventEmitter {

	constructor (app, o = {}) {

		super ()

		if (app == null) throw Error ('app not set')
		if (!(app instanceof Application)) throw Error ('not an Application: ' + app)
		this.app = app

		{

			const {name} = o

			if (typeof name !== 'string' || name === '') throw Error ('incorrect JobSource name: ' + name)
		
			if (app.jobSources.has (o.name)) throw Error ('JobSource already registered: ' + o.name)

			this.name = name
		
		}

		if ('logger' in o) {

			if (!(o.logger instanceof winston.Logger)) throw Error ('the `logger` option must be a winston.Logger')

			this.logger = o.logger

		} 
		else {

			this.logger = app.logger

		}

		const self = this
		
		this.handlers = new Map ([
			'init',
			'end',
			'error',
			'finish',
			'next',
		].map (event => [
			event, [
				function () {
					self.emit ('job-' + event, this)
				}
			]])
		)

		this.pending = new Set ()

		for (const name of ['globals', 'generators', 'pools']) {

			const m = new Map (app [name])

			if (name in o) {

				const value = o [name]

				for (const [k, v] of Object.entries (value)) m.set (k, v)

			}

			this [name] = m

		}

		this.globals.set ('src', this)

		if (!this.globals.has ('logger') && !this.generators.has ('logger')) this.globals.set ('logger', this.logger)

		{

			const {LOGGING_EVENTS} = Tracker

			const local = !o.globals ? {} : o.globals [LOGGING_EVENTS] || {}

			const parent = app.globals.get (LOGGING_EVENTS)

			this.globals.set (LOGGING_EVENTS, OM.merge (local, parent))

		}

		this.request = o.request || {}

		for (const k of ['maxLatency', 'lag']) if (k in o) {

			let v = o [k]

			if (k === 'lag') {

				if (typeof v === 'number') {

					if (v < 0) throw Error ('Invalid (negative) `lag` value: ' + v)
					
					if (!Number.isSafeInteger (v)) throw Error ('Invalid (not a safe integer) `lag` value: ' + v)

				}				
				else {

					if (Array.isArray (v)) v = new Lag (v)
	
					if (!(v instanceof Lag)) throw Error ('Invalid `lag` value (must be a number or array or a Lag object)')

					v.jobSource = this
	
				}	

			}

			this [k] = v

		}

		this.maxPending = o.maxPending || Infinity

		for (const [event, handlers] of app.handlers.entries ())

			for (const handler of handlers)

				this.addHandler (event, handler)

		if (o.on) for (const [k, v] of Object.entries (o.on))
			
			for (const h of (Array.isArray (v) ? v : [v]))

				this.addHandler (k, h)

		app.jobSources.set (this.name, this)

	}

	get [Tracker.LOGGING_ID] () {

		return this.name

	}

	get [Tracker.LOGGING_PARENT] () {

		return this.app

	}

	getJobLoggingDetails ({request, user}) {

		return {request, user}

	}

	addHandler (event, handler) {
	
		const {handlers} = this
		
		if (!handlers.has (event)) handlers.set (event, [])
		
		handlers.get (event).push (handler)

	}

	get capacity () {

		return this.maxPending - this.pending.size

	}

	createJob (request = {}, options) {

		if (this.capacity <= 0) throw new JobSource.OverflowError ()

		const job = new Job ({...this.request, ...request}, options)

		for (const [k, v] of this.globals.entries ())    job [k] = v

		for (const [k, v] of this.generators.entries ()) job [k] = v (job)

		for (const [k, v] of this.pools.entries ())      v.setProxy (job, k)

		for (const [event, handlers] of this.handlers.entries ())

			for (const handler of handlers)
	
				job.on (event, handler)

		job.tracker = new Tracker (job, job.logger)
		job.tracker.listen ()

		if ('maxLatency' in this) job.setMaxLatency (this.maxLatency)
		
		if ('lag' in this) {

			const minLatency = Number (this.lag)

			if (minLatency === Infinity) throw new JobSource.LockedError ()

			job.setMinLatency (minLatency)

		}

		{
			const {pending} = this

			pending.add (job)

			job.on ('next', () => pending.delete (job))

		}

		return job

	}

    async onJobInit   (job) {}

	async onJobEnd (job) {}

	async onJobError  (job) {}

	reset () {

		this.emit ('reset')

	}	

}

JobSource.OverflowError = class extends Error {}
JobSource.LockedError = class extends Error {}

module.exports = JobSource