const EventEmitter = require ('events')

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

		for (const k of ['maxLatency', 'minLatency']) 
			
			if (k in o) 
				
				this [k] = o [k]

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
		
		if ('minLatency' in this) job.setMinLatency (this.minLatency)

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

}

JobSource.OverflowError = class extends Error {}

module.exports = JobSource