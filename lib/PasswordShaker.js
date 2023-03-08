const fs     = require ('fs')
const crypto = require ('crypto')

module.exports = class {

	constructor (o) {
	
		this.path      = o.path

		this.algorithm = o.algorithm || 'sha256'

		this.encoding  = o.encoding  || 'hex'

	}
	
	get pepper () {
	
		return fs.readFileSync (this.path)

	}
	
	sprinkle (amount) {
	
		const buf = Buffer.alloc (amount)

		return crypto.randomFillSync (buf).toString (this.encoding)

	}
		
	cook (raw, salt) {

		const hash = crypto.createHash (this.algorithm)

		for (const s of [this.pepper, salt, raw]) if (s) hash.update (s)

		return hash.digest (this.encoding)

	}

	test (hash, raw, salt) {

		const bin = s => Buffer.from (s, this.encoding)

		return crypto.timingSafeEqual (
			bin (hash), 
			bin (this.cook (raw, salt))
		)
	
	}

}