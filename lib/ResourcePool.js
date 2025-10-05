const util = require ('util')
const EventEmitter = require ('events')
const {Tracker} = require ('events-to-winston')

const PROP_LOGGER = 'logger'

class ResourcePool extends EventEmitter {

	constructor (o = {}) {

		super ()

		this.shared = new Set ()

		if (PROP_LOGGER in o) {

			this.shared.add (PROP_LOGGER)

			this.tracker = new Tracker (this, this [PROP_LOGGER] = o [PROP_LOGGER])

			this.tracker.listen ()

		}

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