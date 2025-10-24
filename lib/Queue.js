const {Cron} = require ('croner')
const JobSource = require ('./JobSource.js')

class Queue extends JobSource {

	constructor (app, o) {

		if (!('maxPending' in o)) o.maxPending = 1

		const {cron, interval} = o

		if (cron != null) {

			const t = typeof cron; if (t !== 'string') throw new Error (`Invalid cron type: '${t}' (expected 'string')`)

			if (!cron) throw new Error (`Invalid cron option`)

		}

		if (interval != null) {

			const t = typeof interval; if (t !== 'number') throw new Error (`Invalid interval type: '${t}' (expected 'number')`)

			if (!Number.isSafeInteger || interval < 1 || interval > 2147483647) throw new Error (`Invalid interval value: ${interval}`)

		}

		if (cron && interval) throw new Error (`'cron' and 'interval' options are mutually exclusive`)

		super (app, o)

		this.isStopped = false

		if (cron)     this.cron     = new Cron (o.cron, {}, () => this.check ())

		if (interval) this.interval = setInterval (() => this.check (), interval)

		app.once ('finish', () => this.stop ())

	}

	stop () {

		if ('interval' in this) clearInterval (this.interval); else if ('cron' in this) this.cron.stop ()

        this.app.jobSources.delete (this.name)

        this.isStopped = true

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

    async onJobInit (job) {

        const data = await this.peek (job)

		if (data == null) {

			job.request = {}

			job.emit ('next')

		}
		else {

			if (typeof data !== 'object') throw Error ('Invalid peek () result: expected Object, got ' + data)

			job.request = {...data, ...job.request}
		
			job.once ('next', () => this.onJobNext ())
		
		}

    }

	onJobNext () {

		this.check ()

	}

}

module.exports = Queue