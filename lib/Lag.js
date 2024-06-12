class Lag {

	constructor (values) {

		if (!Array.isArray (values)) throw Error ('`values` must be given as an array')

		const {length} = values; if (length < 1) throw Error ('At least one value mus be set')

		for (let i = 0; i < length; i ++) {

			const v = values [i]

			if (typeof v !== 'number' || v < 0 || (!Number.isSafeInteger (v) && v !== Infinity)) throw Error ('Invalid lag value: ' + v)
			
			if (i > 0 && v <= values [i - 1]) throw Error ('The sequence of values must grow strictly')

		}

		this.values = values

		this.onSuccess ()

	}

	set jobSource (jobSource) {

		jobSource.on ('reset',     () => this.onSuccess ())
		jobSource.on ('job-end',   () => this.onSuccess ())
		jobSource.on ('job-error', () => this.onFail    ())

	}

	valueOf () {
		return this.values [this.level]
	}

	onSuccess () {
		this.level = 0
	}

	onFail () {
		if (this.values.length - this.level > 1) this.level ++
	}

}

module.exports = Lag