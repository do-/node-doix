const JobSource = require ('./JobSource')

class RequestProcessor extends JobSource {

	process (rq) {
		
		const job = this.app.createJob ()
		
		job.rq = rq
						
		this.copyHandlersTo (job)

		return job.toComplete ()

	}

}

module.exports = RequestProcessor