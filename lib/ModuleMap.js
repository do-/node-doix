const {basename} = require ('path')
const ObjectMerger = require ('./ObjectMerger')
const DirList = require ('./DirList')
const FilePaths = require ('./FilePaths')

class ModuleMap extends Map {

	constructor (o) {
	
		if (o == null) throw new Error ('Options are not set for ModuleMap')

		{
		
			const t = typeof o
			
			if (t !== 'object') throw new Error ('Object valued option bags required by ModuleMap constructor, not ' + t)

		}
		
		super ()

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'dir':
				this.dir = new DirList (v)
				break 

			case 'ext':
				if (typeof v !== 'string') throw new Error ('ext must be a string, not ' + v)
				this.ext = v
				break

			case 'merger':
				if (!(v instanceof ObjectMerger)) throw new Error ('Only ObjectMerger or its descendant can be used as merger')
				this.merger = v
				break

			default:
				throw new Error ('Unknown ModuleMap option: ' + k)

		}

		if (!('dir' in this)) throw new Error ('dir must be set')

		if (!('ext' in this)) this.ext = '.js'

		if (!('merger' in this)) this.merger = new ObjectMerger ()

	}

	get (k) {
	
		{
		
			const t = typeof k
			
			if (t !== 'string') throw new Error ('Only string keys are allowed by ModuleMap, not ' + t)

		}

		const {dir, ext} = this, filter = k + ext
	
		if (!this.has (k)) 
		
			for (const path of FilePaths ({dir, filter})) 
			
				this.set (k, require (path))
		
		if (!this.has (k)) throw new Error (filter + ' not found in neither of ' + [...dir.paths])
		
		const v = super.get (k)
		
		this.merger.emit ('complete', v, k)

		return v
	
	}
	
	load () {

		const {dir, ext} = this, end = - ext.length
	
		for (const path of FilePaths ({dir, filter: s => s.slice (end) === ext}))

			this.set (basename (path, ext), require (path))
			
		for (const [k, v] of this.entries ())

			this.merger.emit ('complete', v, k)

	}
	
	set (k, v) {
	
		{
		
			const t = typeof k
			
			if (t !== 'string') throw new Error ('Only string keys are allowed by ModuleMap, not ' + t)

		}

		{
		
			const t = typeof v
			
			if (t !== 'object') throw new Error ('Only object values are allowed by ModuleMap, not ' + t)

			if (v === null) throw new Error ('Null values are not allowed by ModuleMap')

			if (Array.isArray (v)) throw new Error ('Array values are not allowed by ModuleMap')

		}
		
		if (!this.has (k)) return super.set (k, v)
		
		this.merger.merge (this.get (k), v)
	
	}

}

module.exports = ModuleMap
