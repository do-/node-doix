const LifeCycleTracker = require ('./LifeCycleTracker.js')

class JobEventLogger extends LifeCycleTracker {

	constructor (job) {
	
		super (job, job.logger)

		this.job = job
	
		this.prefix = job.uuid; while (job = job.parent) this.prefix = job.uuid + '/' + this.prefix
			
	}

	methodMessage (methodName) {
	
		return methodName + ' ' + JSON.stringify (this.job.rq)
		
	}

}

module.exports = JobEventLogger