module.exports = {

    getList: async function () {
    
		  return [{id: 1}]
        
    },

    waitFor: async function () {

      const timeout = this.rq.id

      return new Promise (ok => setTimeout (ok, timeout))

    },

    getItem: async function () {

    	const {rq: {id}} = this
    	
    	if (isNaN (id)) throw Error ('Invalid id')

		  return {id}

    },
    
}