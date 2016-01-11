var FromNode = require("./fromNode"),
    extd = require("../extended"),
    Context = require("../context");
 
FromNode.extend({
    instance: {
        nodeType: "ParamNode",

        assertLeft: function (context) {
			this.leftContext = context;		
        },
		/**
			assumption: this is called left-right query parameters
		*/
		assertParam: function(param) {
			var createdFact, leftContext, createdFactId;
			if (this.type(param)) {
				createdFact = this.workingMemory.getFactHandle(param);
				rc = new Context(createdFact, null, null);			// dont' need pattern arg, since from nodes arent' shared!
                rc.set(this.alias, param);
				rc = rc.clone(createdFact, null, this.leftContext.match.merge(rc.match));
				this.__propagate("assert", rc);					
			}
			return createdFact ? createdFact.id : undefined;
		}
    }
}).as(module);