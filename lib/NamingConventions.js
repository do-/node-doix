const {ObjectMerger} = require ('subclassable-object-merger')

const CP_CAMEL  = Symbol ('camel')
const CP_UCFIST = Symbol ('unfirst')

const CH_0 = '0'.charCodeAt (0)
const CH_9 = '9'.charCodeAt (0)
const CH_A = 'a'.charCodeAt (0)
const CH_Z = 'z'.charCodeAt (0)

const OM = new ObjectMerger ({override: ['scalar']})

class NamingConventions {

	constructor (o) {

		this.config = OM.merge (o ?? {}, this.getDefaultOptions ())

		for (const o of Object.values (this.config.types)) {

			switch (o.case) {

				case 'none':
					break

				case 'pascal':
					o [CP_UCFIST] = true

				case 'camel':
					o [CP_CAMEL] = true
					break

				default:
					throw Error ('Unknown case style: ' + o.case)

			}

		}

	}

	getDefaultOptions () {

		return {

			sep: '_',

			maxLength: 64,

			types: {

				module: {

					name: rq => rq.type ?? null,
	
					case: 'pascal',
				
				},
	
				method: {
	
					name: ({id, action, part}) => action ? 'do_' + action : 'get_' + (part ?? (id ? 'item' : 'list')),
	
					case: 'camel',
	
				},	

			}

		}

	}

	getIndexOfInvalidChar (s) {

		const CH_SEP = this.config.sep.charCodeAt (0), {length} = s

		for (let i = 0; i < length; i ++) {

			const c = s.charCodeAt (i)

			if (c > CH_Z) return i

			if (c >= CH_A || c === CH_SEP) continue

			if (i === 0 || c < CH_0 || c > CH_9) return i

		}

		return -1

	}

	getName (type, rq) {

		const {types, maxLength} = this.config

		const o = types [type]; if (!o) throw Error (`Unknown type: ${type}`)

		const s = o.name (rq); if (s == null) return null

		if (typeof s !== 'string') throw Error (`Not a string generated as a ${type} name: ${s}`)

		if (s.length > maxLength) throw Error (`Too long ${type} name: ${s.slice (0, maxLength)}...`)

		{

			const i = this.getIndexOfInvalidChar (s)

			if (i !== -1) throw Error (`Invalid char '${s.charAt (i)}' found in name '${s}' at position ${i}`)

		}

		return o [CP_CAMEL] ? this.toCamel (s, o [CP_UCFIST]) : s

	}

	toCamel = (s, ucFirst) =>  {

		const {sep} = this.config, CH_SEP = sep.charCodeAt (0)

		if (typeof s !== 'string') throw new Error ('Not a string: ' + s)
	
		if (s.charCodeAt (0) === CH_SEP) {
	
			let i = 1; while (s.charCodeAt (i) === CH_SEP) i ++
	
			s = s.slice (i)
	
		}
	
		const {length} = s; if (length === 0) return ''
	
		let to = s.indexOf (sep), r

		if (ucFirst) {

			const firstChar = String.fromCharCode (s.charCodeAt (0) - 32)

			if (to < 0) return firstChar + s.substring (1); else r = firstChar + s.slice (1, to)

		}
		else {

			if (to < 0) return s; else r = s.slice (0, to)

		}
			
		while (true) {
	
			let from = to + 1, c; while (from < length) {

				c = s.charCodeAt (from)

				if (c === CH_SEP) from ++; else break

			}

			if (from === length) return r

			if (c >= CH_A) c -= 32
	
			r += String.fromCharCode (c)
	
			to = s.indexOf (sep, from)
	
			from ++
	
			if (to < 0) return r + s.slice (from); else r += s.slice (from, to)

		}
	
	}
	
}

module.exports = NamingConventions