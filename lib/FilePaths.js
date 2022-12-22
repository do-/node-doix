const fs = require ('fs')
const {sep, extname} = require ('path')

function *FilePaths ({dir, filter} = {}) {

	if (dir == null) throw new Error ('FilePaths: dir must be defined')

	if (typeof dir === 'string') dir = [dir]

	if (typeof dir [Symbol.iterator] !== 'function') throw new Error ('FilePaths: dir must be a string or an iterator')
		
	if (filter === undefined) filter = fn => extname (fn) === '.js'
	
	if (typeof filter === 'string') {

		for (const directoryPath of dir) {
		
			const filePath = directoryPath + sep + filter
			
			if (fs.existsSync (filePath)) yield filePath

		}

	}
	else {

		for (const directoryPath of dir) {

			for (const e of fs.readdirSync (directoryPath, {withFileTypes: true})) {

				if (!e.isFile ()) continue

				const {name} = e, filePath = directoryPath + sep + name

				if (filter (name, directoryPath, filePath)) yield filePath

			}

		}

	}
	
}

module.exports = FilePaths