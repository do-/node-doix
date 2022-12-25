class MethodSelector {

	getModuleName (o) {

		if (o === null || typeof o !== 'object') throw new TypeError ('Illegal argument: ' + o)

		if (!('rq' in o)) return null

		const {rq} = o; if (rq === null || typeof rq !== 'object') throw new TypeError ('Illegal rq: ' + rq)

		if (!('type' in rq)) return null

		const {type} = rq; if (type == null) return null

		if (typeof type !== 'string') throw new TypeError ('Illegal rq.type: ' + type)

		return type

	}

	getMethodName ({rq: {type, id, action, part}}) {

		if (action) return 'do_' + action + '_' + type

		if (!part && id) part = 'item'

		return (part ? 'get_' + part + '_of': 'select') + '_' + type

	}

}

module.exports = MethodSelector