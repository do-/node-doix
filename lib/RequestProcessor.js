const JobSource = require ('./JobSource')

class RequestProcessor extends JobSource {

	process (rq) {
		
		const job = this.createJob (rq)
		
		return job.toComplete ()

	}

}

module.exports = RequestProcessor