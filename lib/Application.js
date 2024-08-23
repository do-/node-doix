const {randomUUID} = require ('crypto')
const EventEmitter = require ('events')
const {ModuleMap}  = require ('require-sliced')
const {Tracker}    = require ('events-to-winston')
const winston      = require ('winston')

const NamingConventions = require ('./NamingConventions.js')
const ResourcePool = require ('./ResourcePool.js')

const o2m = o => {
	const m = new Map (Object.entries (o))
	for (const k of Object.getOwnPropertySymbols (o)) m.set (k, o [k])
	return m
}

class Application extends EventEmitter {

	constructor (o) {

		super ()
	
		if (o === null || typeof o !== 'object') throw TypeError ('Options must be provided as an object')

		if (!('modules' in o)) throw Error ('modules option not defined')

		if (!(o.logger instanceof winston.Logger)) throw Error ('the `logger` option must be a winston.Logger')

		this.handlers = new Map ()
		this.jobSources = new Map ()
		
		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'logger':
				this [k] = v
				break

			case 'globals':
				this.globals = o2m (v)
				break

			case 'generators':
				this.generators = o2m (v)
				break
					
			case 'handlers':
				for (const [event, h] of Object.entries (v)) this.handlers.set (event, Array.isArray (h) ? h : [h])
				break

			case 'pools':
				const kv = Object.entries (v)
				for (const [k, v] of kv) {
					if (!(v instanceof ResourcePool)) throw 'Not a ResourcePool: ' + k
					v.name = k
					v.app = this
				}
				this.pools = new Map (kv)
				break

			case 'modules':
				this.modules = new ModuleMap (v)
				break

			case 'NamingConventions':
				if (!(v instanceof NamingConventions)) throw new TypeError ('Only NamingConventions or its descendant can be used as namingConventions')
				this.namingConventions = v
				break

			default:
				throw new Error ('Unknown Application option: ' + k)

		}

		if (!('globals' in this)) this.globals = new Map ()
		this.globals.set ('app', this)

		if (!('generators' in this)) this.generators = new Map ()
		if (!this.generators.has ('id')) this.generators.set ('id', randomUUID)

		if (!this.globals.has (Tracker.LOGGING_EVENTS)) this.globals.set (Tracker.LOGGING_EVENTS, {

			method: {
				level: 'info',
				message: function () {
					const {method} = this
					return method [ModuleMap.MODULE] [ModuleMap.MODULE_NAME] + '.' + method [ModuleMap.METHOD_NAME]
				},
				details: {},
			},
		
			finish: {
				level: 'info',
				message: s => s,
				elapsed: true,
			}

		})

		if (!('pools' in this)) this.pools = new Map ()
				
		if (!('namingConventions' in this)) this.namingConventions = new NamingConventions ()

	}

	getMethod (rq) {

		const {namingConventions, modules} = this

		const moduleName = namingConventions.getModuleName (rq); if (moduleName == null) return
	
		return modules.getMethod (moduleName, namingConventions.getMethodName (rq))

	}


}

module.exports = Application