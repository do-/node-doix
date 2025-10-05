const util = require ('util')
const EventEmitter = require ('events')

class ResourcePool extends EventEmitter {

	constructor () {

		super ()
		
		this.shared = new Set (['logger'])

	}

	addSharedProperties (o) {
	
		o.pool = this

		for (const k of this.shared) if (!(k in o)) o [k] = this [k]

	}

	async onAcquire () {

		// do nothing

	}
	
	async setResource (job, name) {
	
		const raw = await this.acquire ()

		const resource = new (this.wrapper) (raw)

		job [name] = resource

		resource.job = job
		resource.name = name

		this.addSharedProperties (resource)

		job.on ('finish', async () => {
		
			try {

				await resource.release ()

			}
			catch (x) {

				resource.emit ('error', x)

			}

		})

		await this.onAcquire (resource)
		
		return resource

	}
	
	setProxy (job, resourceName) {

		const pool = this, proxy = {}

		for (let {prototype} = pool.wrapper; prototype !== null; prototype = prototype.__proto__) {

			for (const propertyName of Object.getOwnPropertyNames (prototype))

				if (util.types.isAsyncFunction (prototype [propertyName]))

					proxy [propertyName] = async function () {

						if (job [resourceName] === proxy) await pool.setResource (job, resourceName)
						
						const resource = job [resourceName], method = resource [propertyName]

						return method.apply (resource, arguments)

					}

		}

		this.addSharedProperties (proxy)

		proxy.job = job

		job [resourceName] = proxy

	}

}

module.exports = ResourcePool