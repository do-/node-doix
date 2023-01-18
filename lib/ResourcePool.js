const EventEmitter = require ('events')
const util = require ('util')

class ResourcePool extends EventEmitter {

	inject (o) {
	
		o.pool = this
		
		const {globals} = this; if (!globals) return
		
		for (const k in globals) o [k] = globals [k]

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

		let proxy = {}; for (const k of Object.getOwnPropertyNames (prototype))

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