class JobSource {

	constructor (app, o = {}) {

		this.app = app
		
		this.handlers = new Map ()
		
		const {on} = o; if (!on) return
		
		for (const [k, v] of Object.entries (on)) 
			
			for (const h of (Array.isArray (v) ? v : [v]))
				
				this.addHandler (k, h)

	}
	
	addHandler (event, handler) {
	
		const {handlers} = this
		
		if (!handlers.has (event)) handlers.set (event, [])
		
		handlers.get (event).push (handler)

	}

	copyHandlersTo (job) {

		for (const [event, handlers] of this.handlers.entries ())

			for (const handler of handlers) 		

				job.on (event, handler)

	}

}

module.exports = JobSource