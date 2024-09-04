module.exports = {

    getList: async function () {
    
		  return [{id: 1}]
        
    },

    doWaitFor: async function () {

      const timeout = this.request.id

      return new Promise (ok => setTimeout (ok, timeout))

    },

    getItem: async function () {

    	const {request: {id}} = this
    	
    	if (isNaN (id)) throw Error ('Invalid id')

		  return {id}

    },

    getOne: async function () {

      throw 1

    },

    doFail: async function () {

      this.raise ('DEBUG', {field: 'id'})

    },
    
}