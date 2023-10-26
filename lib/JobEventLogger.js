const EventLogger = require ('./EventLogger.js')

const LOG_ID = Symbol ('LOG_ID')
const LOG_START = Symbol ('LOG_START')

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

		this.job [LOG_START] = Date.now ()
	
		return '>'
		
	}

	methodMessage (methodName) {
	
		return methodName + ' ' + JSON.stringify (this.job.rq)
		
	}

	finishMessage () {

		return '< ' + (Date.now () - this.job [LOG_START]) + ' ms'

	}

}

module.exports = JobEventLogger