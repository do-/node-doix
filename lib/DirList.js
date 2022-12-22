const DirPaths = require ('./DirPaths.js')

class DirList {

	constructor ({root, filter, live} = {}) {
	
		this.dir = {root, filter}

		this.live = live === undefined ? true : !!live
	
	}

	get paths () {

		const it = DirPaths (this.dir)

		if (this.live) return it
		
		const value = [...it]

		Object.defineProperty (this, 'paths', {value})

		return value
	
	}

}

module.exports = DirList