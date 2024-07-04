const {randomUUID} = require ('crypto')

const ModuleMap = require ('./ModuleMap.js')
const MethodSelector = require ('./MethodSelector.js')
const Job = require ('./Job.js')
const ConsoleLogger = require ('./ConsoleLogger.js')

class Application {

	constructor (o) {
	
		if (o === null || typeof o !== 'object') throw TypeError ('Options must be provided as an object')

		if (!('modules' in o)) throw Error ('modules option not defined')

		this.handlers = new Map ()
		
		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'logger':
			case 'trackerClass':
				this [k] = v
				break

			case 'globals':
				this.globals = new Map (Object.entries (v))
				break

			case 'generators':
				this.generators = new Map (Object.entries (v))
				break
					
			case 'handlers':
				for (const [event, h] of Object.entries (v)) this.handlers.set (event, Array.isArray (h) ? h : [h])
				break

			case 'pools':
				const kv = Object.entries (v)
				for (const [k, v] of kv) v.app = this
				this.pools = new Map (kv)
				break

			case 'modules':
				this.modules = new ModuleMap (v)
				break

			case 'methodSelector':
				if (!(v instanceof MethodSelector)) throw new TypeError ('Only MethodSelector or its descendant can be used as methodSelector')
				this.methodSelector = v
				break

			default:
				throw new Error ('Unknown Application option: ' + k)

		}

		if (!('globals' in this)) this.globals = new Map ()
		this.globals.set ('app', this)
		
		if (!('generators' in this)) this.generators = new Map ()
		if (!('pools' in this)) this.pools = new Map ()
				
		if (!('methodSelector' in this)) this.methodSelector = new MethodSelector ()

		if (!('logger' in this)) this.logger = ConsoleLogger.DEFAULT
		if (!('trackerClass' in this)) this.trackerClass = require ('./JobLifeCycleTracker.js')

	}

	createJob (rq) {

		let job = new Job (rq)

		for (const [k, v] of this.globals.entries ())    job [k] = v
		for (const [k, v] of this.generators.entries ()) job [k] = v (job)
		for (const [name, pool] of this.pools.entries ())  pool.setProxy (job, name)

		if (!('uuid'   in job)) job.uuid = randomUUID ()
		if (!('logger' in job)) job.logger = this.logger

		for (const [event, handlers] of this.handlers.entries ())
			for (const handler of handlers)
				job.on (event, handler)
		
		return job

	}

}

module.exports = Application