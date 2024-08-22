class MethodSelector {

	getModuleName (rq) {

		if (!('type' in rq)) return null

		const {type} = rq; if (type == null) return null

		if (typeof type !== 'string') throw new TypeError ('Illegal rq.type: ' + type)

		return type

	}

	getMethodName ({type, id, action, part}) {

		if (action) return 'do_' + action + '_' + type

		if (!part && id) part = 'item'

		return (part ? 'get_' + part + '_of': 'select') + '_' + type

	}

}

module.exports = MethodSelector