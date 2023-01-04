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

	errorMessage () {
	
		const {error} = this.job

		let s; if (error instanceof Error) {
		
			s = error.stack.split ('\n').map (s => s.trim ()).join (' ').trim ()
		
		}
		else {
		
			s = '' + error
		
		}
	
		return this.message (s, 'error')
		
	}

	finishMessage () {

		return this.message ('< ' + (Date.now () - this.now) + ' ms')

	}

}

module.exports = JobEventLogger