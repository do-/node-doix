const Queue = require ('./Queue.js')

class LinkedQueue extends Queue {

    #head = undefined;
	#tail = undefined;
	#size = 0;

	constructor (app, o) {

        if (!('maxSize' in o)) o.maxSize = Infinity
            
        {

            const {maxSize} = o; if (maxSize !== Infinity) {

                if (!Number.isSafeInteger (maxSize)) throw Error (`Invalid maxSize: ${maxSize}`)

                if (maxSize <= 0) throw Error (`Non-positive maxSize: ${maxSize}`)

            }
            
        }

        super (app, o)        

        this.maxSize = o.maxSize

    }

    get size () {

        return this.#size

    }

    add (request) {

        {

            const {maxSize} = this

            if (this.#size >= maxSize) throw Error (`${this.name} overflow: maxSize=${maxSize} exceeded`)

        }        

        const node = {request}

		if ((++ this.#size) === 1) {

            this.#head = node

        }
        else {

            this.#tail.next = node

        }

		this.#tail = node

        this.check ()

    }

    async peek () {

        if (this.#size === 0) return null; this.#size --

        const {request, next} = this.#head

		this.#head = next; return request

    }

}

module.exports = LinkedQueue