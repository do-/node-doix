const {Tracker} = require ('events-to-winston')
const Queue = require ('./Queue.js')

const NC = ['+', '-'].map (sign => ([sign, Number (`${sign}1`)]))

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

    #resize (i, request) {

        const [sign, delta] = NC [i]

        this.#size += delta

        this.emit (sign, sign === '+' ? request : this.#head.request)

        return this.#size

    }

    add (request) {

        {

            const {maxSize} = this

            if (this.#size >= maxSize) throw Error (`${this.name} overflow: maxSize=${maxSize} exceeded`)

        }        

        const node = {request}

		if (this.#resize (0, request) === 1) {

            this.#head = node

        }
        else {

            this.#tail.next = node

        }

		this.#tail = node

        this.check ()

    }

    async peek () {

        if (this.#size === 0) return null; this.#resize (1)

        const {request, next} = this.#head

		this.#head = next; return request

    }

	get [Tracker.LOGGING_EVENTS] () {

        const details = request => ({size: this.size, maxSize: this.maxSize, request})

		return {

            '+': {
				level: 'info',
				details,
            },

            '-': {
				level: 'info',
				details,
            },

        }

	}

}

module.exports = LinkedQueue