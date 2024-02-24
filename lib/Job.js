const EventEmitter = require ('events')
const TRACKER = Symbol ('tracker')
const TODO = Symbol ('todo')

class Job extends EventEmitter {

	constructor (rq = {}) {
		
		super ()
		
		this.rq = rq
	
	}

	assertTracking () {

		if (TRACKER in this) return

		const {trackerClass, logger} = this.app

		this [TRACKER] = new trackerClass (this, logger)

	}

	get tracker () {

		this.assertTracking ()

		return this [TRACKER]

	}

	clone (rqOverride) {
	
		const rq = JSON.parse (JSON.stringify (this.rq)); if (rqOverride) Object.assign (rq, rqOverride)
	
		const job = this.app.createJob (rq)
		
		job.parent = this
				
		return job
	
	}

	waitFor (promise) {
	
		this [TODO].push (promise)
	
	}

	fail (error) {
	
		this.waitFor (new Promise (
		
			(ok, fail) => fail (error)
		
		))
	
	}
	
	async toBroadcast (event, payload) {
	
		this [TODO] = []

		this.emit (event, payload)
		
		return Promise.all (this [TODO])
		
	}
	
	async toComplete () {

		this.assertTracking ()

		try {

			await this.toBroadcast ('start')

			const {app} = this, {methodSelector} = app

			const moduleName = methodSelector.getModuleName (this); 
			
			if (moduleName === null) return

			this.module = app.modules.get (moduleName)

			await this.toBroadcast ('module')

			const methodName = methodSelector.getMethodName (this)

			if (!(methodName in this.module)) throw Error ('Method "' + methodName + '" not found in "' + moduleName + '" module')

			await this.toBroadcast ('method', methodName)

			const method = this.module [methodName]

			this.result = await method.call (this)

			await this.toBroadcast ('end')

			return this.result

		}
		catch (error) {

			this.error = error

			await this.toBroadcast ('error', error)

			if (this.error === undefined) return undefined
			
			throw error

		}
		finally {

			await this.toBroadcast ('finish')

		}

	}

	* resources (clazz) {

		for (const [k, v] of this.app.pools.entries ()) 
		
			if (v instanceof clazz)
			
				yield this [k]

	}

}

module.exports = Job