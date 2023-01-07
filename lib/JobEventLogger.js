const EventLogger = require ('./EventLogger.js')

class JobEventLogger extends EventLogger {

	constructor (job) {
	
		super (job)

		this.job = job
		
		this.logger = job.logger
			
	}
	
	get prefix () {

		let j = this.job, p = j.uuid
		
		while (j = j.parent) p = j.uuid + '/' + p
		
		return p

	}
		
	startMessage () {
	
		return this.message ('>')
		
	}

	methodMessage (m) {
	
		return this.message (m + ' ' + JSON.stringify (this.job.rq))
		
	}

}

module.exports = JobEventLogger