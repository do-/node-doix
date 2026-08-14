const {opendir} = require ('node:fs/promises')
const Queue     = require ('./Queue')

module.exports = class FileDirectoryQueue extends Queue {

    constructor (app, o) {

        super (app, o)

        this.dirname = o.dirname

    }

    test (name) {

        return true

    }

    async peek () {

        const dir = await opendir (this.dirname)

        for await (const {name} of dir) try {

            if (this.test (name)) return {id: name}

        }
        catch (err) {

            this.emit ('error', err)

        }
        
        return null

    }

}