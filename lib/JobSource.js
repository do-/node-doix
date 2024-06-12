const EventEmitter = require ('events')
const Lag = require ('./Lag')

class JobSource extends EventEmitter {

	constructor (app, o = {}) {

		super ()

		this.app = app

		const self = this
		
		this.handlers = new Map ([
			'start',
			'end',
			'error',
			'finish',
			'finished',
		].map (event => [
			event, [
				function () {
					self.emit ('job-' + event, this)
				}
			]])
		)

		this.pending = new Set ()
		
		this.globals = new Map (Object.entries (o.globals || {}))
		this.generators = new Map (Object.entries (o.generators || {}))
		this.rq = o.rq || {}

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
		
		const {on} = o; if (!on) return
		
		for (const [k, v] of Object.entries (on)) 
			
			for (const h of (Array.isArray (v) ? v : [v]))
				
				this.addHandler (k, h)

	}

	setRouter (router) {

		this.router = router

	}
	
	addHandler (event, handler) {
	
		const {handlers} = this
		
		if (!handlers.has (event)) handlers.set (event, [])
		
		handlers.get (event).push (handler)

	}

	get capacity () {

		return this.maxPending - this.pending.size

	}

	createJob (rq = {}) {

		if (this.capacity <= 0) throw new JobSource.OverflowError ()

		const job = this.app.createJob ({...this.rq, ...rq})
	
		for (const [k, v] of this.globals.entries ())    job [k] = v
		
		for (const [k, v] of this.generators.entries ()) job [k] = v (job)

		if ('maxLatency' in this) job.setMaxLatency (this.maxLatency)
		
		if ('lag' in this) {

			const minLatency = Number (this.lag)

			if (minLatency === Infinity) throw new JobSource.LockedError ()

			job.setMinLatency (minLatency)

		}

		for (const [event, handlers] of this.handlers.entries ())

			for (const handler of handlers) 		

				job.on (event, handler)

		{
			const {pending} = this

			pending.add (job)

			job.on ('finished', () => pending.delete (job))

		}				

		return job

	}

	reset () {

		this.emit ('reset')

	}	

}

JobSource.OverflowError = class extends Error {}
JobSource.LockedError = class extends Error {}

module.exports = JobSource