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

		const {eventLoggerClass} = this; if (eventLoggerClass) resource.eventLogger = new eventLoggerClass (resource)

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
	
	setProxy (job, name) {
	
		const pool = this, {prototype} = pool.wrapper

		let proxy = {job}; for (const k of Object.getOwnPropertyNames (prototype))

			if (util.types.isAsyncFunction (prototype [k]))

				proxy [k] = async function () {

					const resource = await pool.toSet (job, name)

					return prototype [k].apply (resource, arguments)

				}
				
		this.inject (proxy)

		job [name] = proxy

	}

}

module.exports = ResourcePool