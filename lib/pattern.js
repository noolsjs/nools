"use strict";
var extd = require("./extended"),
    isEmpty = extd.isEmpty,
    merge = extd.merge,
    forEach = extd.forEach,
    declare = extd.declare,
    constraintMatcher = require("./constraintMatcher"),
    constraint = require("./constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    FromConstraint = constraint.FromConstraint,
    parser = require("./parser");


var id = 0;
var Pattern = declare({});

var ObjectPattern = Pattern.extend({
        static: {
            fromLiteral: function(pojo, prototype) {
                var me = Object.create(prototype || ObjectPattern.prototype);
                me.$className = pojo.$className;
                //
                me.id         = id++;
                me.type       = pojo.type;
                me.set('alias', pojo.alias);
                // some constraints; not, exists,... do not directly have a pattern, they condition another constraint
                if( undefined !== pojo.pattern ) {
                    me.pattern = pojo.pattern;
                }
                //
                me.constraints = pojo.constraints.map(function(cnstPojo) {
                   var theClass = constraint[cnstPojo.$className]
                       ,instance;
                   //
                   instance = theClass.fromLiteral(cnstPojo);
                   return  instance;
                });
                //
                forEach(me.constraints, function (constraint) {
                    constraint.set("alias", me.get('alias'));
                });
                return me;
            }
        },

    instance: {
        asLiteral: function(flow) {
            var def =  {
                $className: 'ObjectPattern'
                ,type:      this.type
                ,alias:     this.alias
                ,pattern:   this.pattern
                ,constraints: undefined
            }
            ,found;

            def.constraints = this.constraints.map(function(constraint) {
                return constraint.asLiteral(flow);     
            });
            return def;
        },
		//
        // store is actually reference; e.g. {propertFromMatchedFact: alias, ...}
        // what are options - I guess it's scope ? 
        constructor: function (type, alias, conditions, store, options) {
            options			= options || {};
            this.id			= id++;
            this.type		= type;					// the type obviously
            this.alias		= alias;				// the alias for the pattern overall, same as (single) condition alias
            this.conditions = conditions;			// in parser format
            this.pattern	= options.pattern;		// preserves the pattern string
            //
            // we are going to construct the alpha network, e.g. condition chain
            // we have at least a type constraint, start here...
            var constraints = [new constraint.ObjectConstraint(type)];
            //
            var constrnts = constraintMatcher.toConstraints(conditions, merge({alias: alias}, options));
            if (constrnts.length) {
                constraints = constraints.concat(constrnts);
            } else {												// there is always at least two constraints type and true
                var cnstrnt = new constraint.TrueConstraint();
                constraints.push(cnstrnt);
            }
            if (store && !isEmpty(store)) {
                var atm = new constraint.HashConstraint(store);		// this is who we add variables to a context via a constraint
                constraints.push(atm);
            }
			// 
			// this only works if conditions contains a single constraint, you want nested patterns in the case of conditional elements
			// with expressions inside of them...
            forEach(constraints, function (constraint) {       
                constraint.set("alias", alias);
            });
            //
            this.constraints = constraints;
        },
        //
        // what does this do ? how specific it is... this allows you to order the alpha nodes in the chain...
        getSpecificity: function () {
            var constraints = this.constraints, specificity = 0;
            for (var i = 0, l = constraints.length; i < l; i++) {
                if (constraints[i] instanceof EqualityConstraint) {
                    specificity++;
                }
            }
            return specificity;
        },

        hasConstraint: function (type) {
            return extd.some(this.constraints, function (c) {
                return c instanceof type;
            });
        },

        hashCode: function () {
            return [this.type, this.alias, extd.format("%j", this.conditions)].join(":");
        },

        toString: function () {
            return extd.format("%j", this.constraints);
        }
    }
}).as(exports, "ObjectPattern");

var FromPattern = ObjectPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || FromPattern.prototype]);
            me.from = FromConstraint.fromLiteral(pojo.from);
            return me;
        }
    },
    //
    instance: {
        asLiteral: function(flow) {
            var def = this._super(arguments);
            def.$className = 'FromPattern';
            def.from = this.from.asLiteral(flow);
            return def;
        },

        type: 'FromPattern',
        constructor: function (type, alias, conditions, store, from, options) {
            this._super([type, alias, conditions, store, options]);
            this.from = new FromConstraint(from, options);
        },

        hasConstraint: function (type) {
            return extd.some(this.constraints, function (c) {
                return c instanceof type;
            });
        },

        getSpecificity: function () {
            return this._super(arguments) + 1;
        },

        hashCode: function () {
            return [this.type, this.alias, extd.format("%j", this.conditions), this.from.from].join(":");
        },

        toString: function () {
            return extd.format("%j from %s", this.constraints, this.from.from);
        }
    }
}).as(exports, "FromPattern");

var CollectPattern = FromPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || AccumulatePattern.prototype]);
            return me;
        }
    },
    instance: {
        type: "CollectPattern"
        ,asLiteral: function(flow) {
            var def = this._super(arguments);
            def.$className = 'AccumulatePattern';
            return def;
        },
		//
        constructor: function (type, alias, conditions, store, options) {
            //this._super([type, alias, conditions, store, options]);
			ObjectPattern.prototype.constructor.call(this, type, alias, conditions, store, options);
			// source expression is baked into CollectNode
            this.from = {
				asLiteral: function() {
					return {}
				}
				,assert: function() {
					throw new Error('the collection is implicitly provided');
				}
			};	
        },
        //
        getAccumulation: function() {
            return this.from.accumulation;
        }
        //
        ,block: function(b) {
            this.from.blocked = b;    
        }
    }
}).as(exports, "CollectPattern");

var FromNotPattern = FromPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || FromNotPattern.prototype]);
            return me;
        }
    },

    instance: {
        type: "FromNotPattern"
    }
}).as(exports, "FromNotPattern");

var NotPattern = ObjectPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || NotPattern.prototype]);
            return me;
        }
    },

    instance: {
        asLiteral: function(flow) {
            var def = this._super(arguments);
            def.$className = 'NotPattern';
            return def;
        },

        type: "NotPattern"
    }
}).as(exports, "NotPattern");

var ExistsPattern = ObjectPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || ExistsPattern.prototype]);
            return me;
        }
    },

    instance: {
        asLiteral: function(flow) {
            var def = this._super(arguments);
            def.$className = 'ExistsPattern';
            return def;
        },

        type: "ExistsPattern"
    }
 }).as(exports, "ExistsPattern");

var FromExistsPattern = FromPattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me = this._super([pojo, prototype || FromExistsPattern.prototype]);
            return me;
        }
    },

    instance: {
        asLiteral: function(flow) {
            var def = this._super(arguments);
            def.$className = 'FromExistsPattern';
            return def;
        },

        type: "FromExistsPattern"
    }
}).as(exports, "FromExistsPattern");


var CompositePattern = Pattern.extend({
    static: {
        fromLiteral: function(pojo, prototype) {
            var me          = Object.create(prototype || CompositePattern.prototype)
                ,leftClass  = exports[pojo.leftPattern.$className]
                ,rightClass = exports[pojo.rightPattern.$className];
            //
            me.id = id++;
            me.leftPattern  = leftClass.fromLiteral(pojo.leftPattern);
            me.rightPattern = rightClass.fromLiteral(pojo.rightPattern);
            return me;
        }
    },

    instance: {
        asLiteral: function(flow) {
           var def =  {
                $className:          'CompositePattern'
                ,leftPattern:       this.leftPattern.asLiteral(flow)
                ,rightPattern:      this.rightPattern.asLiteral(flow)
            };
            return def;
        },

        type: "CompositePattern",
        constructor: function (left, right) {
            this.id = id++;
            this.leftPattern = left;
            this.rightPattern = right;
        },

        hashCode: function () {
            return [this.leftPattern.hashCode(), this.rightPattern.hashCode()].join(":");
        },

        getSpecificity: function () {
            return this.rightPattern.getSpecificity() + this.leftPattern.getSpecificity();
        },

        getters: {
            constraints: function () {
                return this.leftPattern.constraints.concat(this.rightPattern.constraints);
            }
        }
    }

}).as(exports, "CompositePattern");


var InitialFact = declare({
    instance: {
        constructor: function () {
            this.id = id++;
            this.recency = 0;
        }
    }
}).as(exports, "InitialFact");

var InitialFactPattern = ObjectPattern.extend({

    instance: {
        type: "ObjectPattern",
        $className : 'InitialFactPattern',
        constructor: function () {
            this._super([InitialFact, "__i__", [], {}]);
        },

        assert: function () {
            return true;
        }
    }
}).as(exports, "InitialFactPattern");


