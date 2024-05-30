const EventEmitter = require ('events')

class pendingource extends EventEmitter {

	constructor (app, o = {}) {

		super ()

		this.app = app
		
		this.handlers = new Map ()
		this.pending = new Set ()
		
		this.globals = new Map (Object.entries (o.globals || {}))
		this.generators = new Map (Object.entries (o.generators || {}))

		for (const k of ['maxLatency', 'minLatency']) 
			
			if (k in o) 
				
				this [k] = o [k]
		
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

	createJob (rq) {

		const job = this.app.createJob (rq)
	
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

module.exports = pendingource