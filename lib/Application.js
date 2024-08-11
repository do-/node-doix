const {randomUUID} = require ('crypto')
const EventEmitter = require ('events')
const {ModuleMap}  = require ('require-sliced')
const winston      = require ('winston')

const MethodSelector = require ('./MethodSelector.js')
const ResourcePool = require ('./ResourcePool.js')

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
		if (!this.generators.has ('id')) this.generators.set ('id', randomUUID)

		if (!('pools' in this)) this.pools = new Map ()
				
		if (!('methodSelector' in this)) this.methodSelector = new MethodSelector ()

	}

}

module.exports = Application