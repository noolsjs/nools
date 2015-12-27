var FromNode = require("./fromNode"),
    extd = require("../extended"),
    Context = require("../context");
	//InitalFact = require('../pattern').InitialFact,
 
FromNode.extend({
    instance: {
        nodeType: "ParamNode",
		//
        constructor: function (pattern, wm) {
            this._super([pattern, wm]);
        },
		/**
			this code assumes parameters are invoked left -> right in order
			is this practical, yes since we control the injection of the facts via the generated query fn
			what that means is if there is no left context this is the first parameter...    
		*/
        assertLeft: function (context) {
 			if( context.fact !== '__i__' ) {
				this.leftContext = context;		// don't store anything, allow to be written over for every invoke of the associated query
			}
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
				if( this.leftContext ) {							// first param since we enforce left-right ordering
					rc = rc.clone(createdFact, null, this.leftContext.match.merge(rc.match));
				}
				this.__propagate("assert", rc);					
			}
			return createdFact ? createdFact.id : undefined;
		}
    }
}).as(module);