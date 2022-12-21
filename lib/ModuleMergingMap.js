const ObjectMerger = require ('./ObjectMerger')

class ModuleMergingMap extends Map {

	constructor (o = {}) {
	
		{
		
			const t = typeof o
			
			if (t !== 'object') throw new Error ('Object valued option bags required by ModuleMergingMap constructor, not ' + t)

		}
		
		super ()

		for (const [k, v] of Object.entries (o)) switch (k) {
		
			case 'merger':
				if (!(v instanceof ObjectMerger)) throw new Error ('Only ObjectMerger or its descendant can be used as merger')
				this.merger = v
				break
			
			default:
				throw new Error ('Unknown ModuleMergingMap option: ' + k)
		
		}
	
		if (!('merger' in this)) this.merger = new ObjectMerger ()

	}
	
	set (k, v) {
	
		{
		
			const t = typeof k
			
			if (t !== 'string') throw new Error ('Only string keys are allowed by ModuleMergingMap, not ' + t)

		}

		{
		
			const t = typeof v
			
			if (t !== 'object') throw new Error ('Only object values are allowed by ModuleMergingMap, not ' + t)

			if (v === null) throw new Error ('Null values are not allowed by ModuleMergingMap')

			if (Array.isArray (v)) throw new Error ('Array values are not allowed by ModuleMergingMap')

		}
		
		if (!this.has (k)) return super.set (k, v)
		
		this.merger.merge (this.get (k), v)
	
	}

}

module.exports = ModuleMergingMap
