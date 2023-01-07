const EventEmitter = require ('events')
const util = require ('util')

class ResourcePool extends EventEmitter {
	
	async toSet (job, name) {
	
		const raw = await this.acquire ()

		const {wrapper} = this

		const resource = new wrapper (raw)

		job [name] = resource
		
		resource.job = job

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
				
		job [name] = proxy

	}

}

module.exports = ResourcePool