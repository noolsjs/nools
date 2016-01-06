var AlphaNode = require("./alphaNode"),
	Context = require('../Context'),
	extd = require("../extended"),
    intersection = extd.intersection,
	InitialFact = require('../pattern').InitialFact;

AlphaNode.extend({
    instance: {

        constructor: function () {
            this.memory = {};
            this._super(arguments);
            this.constraintAssert = this.constraint.assert;
        },

        assert: function (context) {
            if ((this.memory[context.pathsHash] = this.constraintAssert(context.factHash))) {
				if( this.constraint.alias ===  "__i__"  && context.fact.object instanceof InitialFact ) {
					var entrySet = this.__entrySet, i = entrySet.length, entry, outNode, paths, continuingPaths;
					var queries, rules = [];

					entrySet.forEach(function(entry) {
						outNode = entry.key;
						paths = entry.value;
						//
					
						if(paths[0].queryInitialFact) {
							queries = queries || [];
							queries.push(entry);
						}
						else {
							rules.push(entry);
						}
					});
					entrySet = queries ? ( rules.concat(queries) ) : rules;
					while (--i > -1) {
						entry = entrySet[i];
						outNode = entry.key;
						paths = entry.value;

						if ((continuingPaths = intersection(paths, context.paths)).length) {
							outNode['assert'](new Context(context.fact, continuingPaths, context.match));
						}
					}

					}
					else {
						this.__propagate("assert", context);
					}
            }
        },

        modify: function (context) {
            var memory = this.memory,
                hashCode = context.pathsHash,
                wasMatch = memory[hashCode];
            if ((memory[hashCode] = this.constraintAssert(context.factHash))) {
                this.__propagate(wasMatch ? "modify" : "assert", context);
            } else if (wasMatch) {
                this.__propagate("retract", context);
            }
        },

        retract: function (context) {
            var hashCode = context.pathsHash,
                memory = this.memory;
            if (memory[hashCode]) {
                this.__propagate("retract", context);
            }
            memory[hashCode] = null;
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
}).as(module);