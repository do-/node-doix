const {Cron} = require ('croner')
const JobSource = require ('./JobSource.js')

class Queue extends JobSource {

	constructor (app, o) {

		if (!('maxPending' in o)) o.maxPending = 1

		super (app, o)

		const self = this

        this.addHandler ('init', function () {

            this.waitFor (self.onJobStart (this))

        })

		if ('cron' in o) {

			const cron = new Cron (o.cron, {}, () => this.check ())
			
			this.cron = cron

			app.once ('finish', () => cron.stop ())

		}

	}

	check () {

		try {

			const job = this.createJob (), NOP = () => {}

			setImmediate (() => job.outcome ().then (NOP, NOP))

		}
		catch (x) {

			if (x instanceof JobSource.OverflowError) return

			throw x

		}

	}

	async peek () {

		return null

	}

    async onJobStart (job) {

        const data = await this.peek (job)

		if (data == null) {

			job.request = {}

			job.emit ('finished')

		}
		else {

			if (typeof data !== 'object') throw Error ('Invalid peek () result: expected Object, got ' + data)

			job.request = {...data, ...job.request}
		
			job.once ('finished', () => this.onJobFinished ())
		
		}

    }

	onJobFinished () {

		this.check ()

	}

}

module.exports = Queue