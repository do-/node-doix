const EventEmitter = require ('events')
const util = require ('util')

class ResourcePool extends EventEmitter {

	constructor (o) {

		super ()
		
		this.shared = new Set ()

	}

	inject (o) {
	
		o.pool = this

		for (const k of this.shared) if (!(k in o)) o [k] = this [k]

	}
	
	async toSet (job, name) {
	
		const raw = await this.acquire ()

		const {wrapper} = this

		const resource = new wrapper (raw)

		job [name] = resource

		resource.job = job
		
		this.inject (resource)

		if (!('logger' in resource)) resource.logger = this.logger || job.logger

		job.on ('finish', async () => {
		
			try {

				await resource.release ()

			}
			catch (x) {

				this.emit ('error', x)

			}

		})
		
		return resource

	}
	
	setProxy (job, resourceName) {

		const pool = this, proxy = {}

		for (let {prototype} = pool.wrapper; prototype !== null; prototype = prototype.__proto__) {

			for (const propertyName of Object.getOwnPropertyNames (prototype))

				if (util.types.isAsyncFunction (prototype [propertyName]))

					proxy [propertyName] = async function () {

						if (job [resourceName] === proxy) await pool.toSet (job, resourceName)
						
						const resource = job [resourceName], method = resource [propertyName]

						return method.apply (resource, arguments)

					}

		}

		this.inject (proxy)

		proxy.job = job

		job [resourceName] = proxy

	}

}

module.exports = ResourcePool