const ModuleMap = require ('./ModuleMap.js')
const MethodSelector = require ('./MethodSelector.js')
const Job = require ('./Job.js')

class Application {

	constructor (o) {
	
		if (o === null || typeof o !== 'object') throw TypeError ('Options must be provided as an object')

		if (!('modules' in o)) throw Error ('modules option not defined')
		
		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'globals':
				this.globals = new Map (Object.entries (v))
				break

			case 'generators':
				this.generators = new Map (Object.entries (v))
				break

			case 'modules':
				this.modules = new ModuleMap (v)
				break

			case 'methodSelector':
				if (!(v instanceof MethodSelector)) throw new TypeError ('Only MethodSelector or its descendant can be used as methodSelector')
				this.methodSelector = v
				break

			default:
				throw new Error ('Unknown ModuleMap option: ' + k)

		}

		if (!('globals' in this)) this.globals = new Map ()
		this.globals.set ('app', this)
		
		if (!('generators' in this)) this.generators = new Map ()
		
		if (!('methodSelector' in this)) this.methodSelector = new MethodSelector ()

	}

	createJob () {

		let job = new Job ()

		for (const [k, v] of this.globals.entries ())    job [k] = v
		for (const [k, v] of this.generators.entries ()) job [k] = v ()

		return job

	}

}

module.exports = Application