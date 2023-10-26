const EventLogger = require ('./EventLogger.js')

const LOG_ID = Symbol ('LOG_ID')

class JobEventLogger extends EventLogger {

	constructor (job) {
	
		super (job)

		this.job = job
		
		this.logger = job.logger
			
	}

	getPrefix () {
		
		let {job} = this; if (LOG_ID in job) return job [LOG_ID]
		
		let path = job.uuid; while (job = job.parent) path = job.uuid + '/' + path
		
		return this.job [LOG_ID] = path

	}
		
	startMessage () {
	
		return '>'
		
	}

	methodMessage (methodName) {
	
		return methodName + ' ' + JSON.stringify (this.job.rq)
		
	}

}

module.exports = JobEventLogger