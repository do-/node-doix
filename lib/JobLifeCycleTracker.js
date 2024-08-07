const LifeCycleTracker = require ('./LifeCycleTracker.js')

class JobLifeCycleTracker extends LifeCycleTracker {

	constructor (job) {
	
		super (job, job.logger)

		this.job = job
	
		this.prefix = job.id; while (job = job.parent) this.prefix = job.id + '/' + this.prefix
			
	}

	methodMessage (methodName) {
	
		return methodName + ' ' + JSON.stringify (this.job.rq)
		
	}

}

module.exports = JobLifeCycleTracker