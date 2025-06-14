const Queue = require ('./Queue.js')

class LinkedQueue extends Queue {

    #head = undefined;
	#tail = undefined;
	#size = 0;

    add (request) {

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