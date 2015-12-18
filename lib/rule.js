"use strict";
var extd = require("./extended"),
    isArray = extd.isArray,
    Promise = extd.Promise,
    declare = extd.declare,
    isHash = extd.isHash,
    isString = extd.isString,
    format = extd.format,
    parser = require("./parser"),
    pattern = require("./pattern"),
	parseRules = require('./parser/nools/tokens.js').parseRules,
    ObjectPattern = pattern.ObjectPattern,
    FromPattern = pattern.FromPattern,
    NotPattern = pattern.NotPattern,
    ExistsPattern = pattern.ExistsPattern,
    FromNotPattern = pattern.FromNotPattern,
    FromExistsPattern = pattern.FromExistsPattern,
    CompositePattern = pattern.CompositePattern,
    CollectPattern = pattern.CollectPattern,
    StateFactPattern = pattern.StateFactPattern;

//
var parseConstraint = function (constraint) {
    if (typeof constraint === 'function') {
        // No parsing is needed for constraint functions
        return constraint;
    }
    return parser.parseConstraint(constraint);
};

var parseExtra = extd
    .switcher()
    .isUndefinedOrNull(function () {
        return null;
    })
    .isLike(/^from +/, function (s) {
        return {from: s.replace(/^from +/, "").replace(/^\s*|\s*$/g, "")};
    })
    .def(function (o) {
        throw new Error("invalid rule constraint option " + o);
    })
    .switcher();

var normailizeConstraint = extd
    .switcher()
    .isLength(1, function (c) {
        throw new Error("invalid rule constraint " + format("%j", [c]));
    })
    .isLength(2, function (c) {
        c.push("true");
        return c;
    })
    //handle case where c[2] is a hash rather than a constraint string
    .isLength(3, function (c) {
        if (isString(c[2]) && /^from +/.test(c[2])) {
            var extra = c[2];
            c.splice(2, 0, "true");
            c[3] = null;
            c[4] = parseExtra(extra);
        } else if (isHash(c[2])) {
            c.splice(2, 0, "true");
        }
        return c;
    })
    //handle case where c[3] is a from clause rather than a hash for references
    .isLength(4, function (c) {
        if (isString(c[3])) {
            c.splice(3, 0, null);
            c[4] = parseExtra(c[4]);
        }
        return c;
    })
    .def(function (c) {
        if (c.length === 5) {
            c[4] = parseExtra(c[4]);
        }
        return c;
    })
    .switcher();

var getParamType = function getParamType(type, scope) {
    scope = scope || {};
    var getParamTypeSwitch = extd
        .switcher()
        .isEq("string", function () {
            return String;
        })
        .isEq("date", function () {
            return Date;
        })
        .isEq("array", function () {
            return Array;
        })
        .isEq("boolean", function () {
            return Boolean;
        })
        .isEq("regexp", function () {
            return RegExp;
        })
        .isEq("number", function () {
            return Number;
        })
        .isEq("object", function () {
            return Object;
        })
        .isEq("hash", function () {
            return Object;
        })
        .def(function (param) {
            throw new TypeError("invalid param type " + param);
        })
        .switcher();

    var _getParamType = extd
        .switcher()
        .isString(function (param) {
            var t = scope[param];
            if (!t) {
                return getParamTypeSwitch(param.toLowerCase());
            } else {
                return t;
            }
        })
        .isFunction(function (func) {
            return func;
        })
        .deepEqual([], function () {
            return Array;
        })
        .def(function (param) {
            throw  new Error("invalid param type " + param);
        })
        .switcher();

    return _getParamType(type);
};
//
var collectRegExp = /collect\s*\((.*)\)$/;
//
var parsePattern = extd
    .switcher()
    .containsAt("or", 0, function (condition) {
        condition.shift();
        return extd(condition).map(function (cond) {
            cond.scope = condition.scope;
            return parsePattern(cond);
        }).flatten().value();
    })
    .containsAt("not", 0, function (condition) {
        condition.shift();
        condition = normailizeConstraint(condition);
        if (condition[4] && condition[4].from) {
            return [
                new FromNotPattern(
                    getParamType(condition[0], condition.scope),
                    condition[1] || "m",
                    parseConstraint(condition[2] || "true"),
                    condition[3] || {},
                    parseConstraint(condition[4].from),
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        } else {
            return [
                new NotPattern(
                    getParamType(condition[0], condition.scope),
                    condition[1] || "m",
                    parseConstraint(condition[2] || "true"),
                    condition[3] || {},
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        }
    })
    .containsAt("exists", 0, function (condition) {
        condition.shift();
        condition = normailizeConstraint(condition);
        if (condition[4] && condition[4].from) {
            return [
                new FromExistsPattern(
                    getParamType(condition[0], condition.scope),
                    condition[1] || "m",
                    parseConstraint(condition[2] || "true"),
                    condition[3] || {},
                    parseConstraint(condition[4].from),
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        } else {
            return [
                new ExistsPattern(
                    getParamType(condition[0], condition.scope),
                    condition[1] || "m",
                    parseConstraint(condition[2] || "true"),
                    condition[3] || {},
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        }
    })
    .def(function (condition) {
        if (typeof condition === 'function') {
            return [condition];
        }
        condition = normailizeConstraint(condition);
        if (condition[4] && condition[4].from) {
            var fromArg = condition[4].from
				,merged,setOrientedAliases,collectExpr, setOrientedConditions, patterns, merged, isRules, collectPattern,compPat;
			//
			function mergePatterns(patterns, merged, setAliases) {
				var flattened = extd(patterns).flatten().value();		
				flattened.forEach(function (thePattern) {
					setAliases.push(thePattern.alias);
					merged.push([thePattern]);
				});
				return merged;
			}
			//
			if( 'string' === typeof  fromArg && fromArg.match( collectRegExp ) ) {
				collectExpr		= fromArg.match(collectRegExp)[1];
				//
				// every alias from these setOrientedConditions is an SOV:  Set Oriented Variable
				setOrientedConditions	= parseRules(collectExpr);
				setOrientedAliases		= []; merged = [];
				//
				isRules = extd.every(setOrientedConditions, function (cond) {
					return isArray(cond);
				});
				if (isRules && setOrientedConditions.length === 1) {
					setOrientedConditions	= setOrientedConditions[0];
					isRules		= false;
				}
				//
				collectPattern = new CollectPattern(
					getParamType(condition[0], condition.scope),			// type; Array or Object 
					condition[1] || "m",									// alias
					parseConstraint(condition[2] || "true"),				// expression using from 
					condition[3] || {},										// store
					{scope: condition.scope, pattern: condition[2]}			// misc...
				);
				//
				if( isRules ) {
					setOrientedConditions.map(function(cond) {
						cond.scope	= condition.scope;
						patterns	= parsePattern(cond);
						mergePatterns(patterns, merged, setOrientedAliases);
					});
					//
					collectPattern.setOrientedAliases = setOrientedAliases;
					merged.push([collectPattern]);
					return merged;
				}
				else {												// there was a single condition inside of from collect( expr );
					setOrientedConditions.scope	= condition.scope;
					patterns			= parsePattern(setOrientedConditions);
					mergePatterns(patterns, merged, setOrientedAliases);
					collectPattern.setOrientedAliases = setOrientedAliases;
					merged.push([collectPattern]);					
					return merged;
				}
			}
            else {
                return [
                    new FromPattern(
                        getParamType(condition[0], condition.scope),
                        condition[1] || "m",
                        parseConstraint(condition[2] || "true"),
                        condition[3] || {},
                        parseConstraint(condition[4].from),
                        {scope: condition.scope, pattern: condition[2]}
                    )
                ];
            }
        } else if( condition[0] === Accumulate ) {
            return [
                new AccumulatePattern(
                    getParamType(Accumulate, condition.scope),
                    condition[1] || "m",
                    parseConstraint( condition[2] ),			// this doesn't make sense ->  "true"),
                    condition[3] || {},
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        } else {
            return [
                new ObjectPattern(
                    getParamType(condition[0], condition.scope),
                    condition[1] || "m",
                    parseConstraint(condition[2] || "true"),
                    condition[3] || {},
                    {scope: condition.scope, pattern: condition[2]}
                )
            ];
        }    
    }).switcher();

var Rule = declare({

    static: {
        fromLiteral: function(pojo, prototype) {
            var me = Object.create(prototype || Rule.prototype)
                ,patternLiteral = pojo.pattern
                ,patternClass = pattern[patternLiteral.$className];
            //
            me.name =          pojo.name;
            //
            me.agendaGroup =   pojo.agendaGroup;
            me.autoFocus =     pojo.autoFocus;
            me.priority =      pojo.priority;
            //
            me.pattern =      patternClass.fromLiteral(patternLiteral);
            me.cb =           pojo.cb;
            return me;
        }
    },
    
    instance: {
        asLiteral: function(flow) {
            var def =  {
                name:  this.name
            };
            this.agendaGroup    ?  (def.agendaGroup = this.agendaGroup) : undefined;
            this.autoFocus      ?  (def.autoFocus = this.autoFocus)   : undefined;
            def.priority = this.priority
            //
            def.pattern =       this.pattern.asLiteral(flow);
            def.cb =            this.cb;
            return def;
        },

        constructor: function (name, options, pattern, cb) {
            this.name = name;
            this.pattern = pattern;
            this.cb = cb;
			this.noLoop = options.noLoop;
            if (options.agendaGroup) {
                this.agendaGroup = options.agendaGroup;
                this.autoFocus = extd.isBoolean(options.autoFocus) ? options.autoFocus : false;
            }
            this.priority = options.priority || options.salience || 0;
        },

        fire: function (flow, match) {
            var ret = new Promise(), cb = this.cb;
           try {
                if (cb.length === 3) {
                    cb.call(flow, match.factHash, flow, ret.resolve);
                } else {
                    ret = cb.call(flow, match.factHash, flow);
                }
            } catch (e) {
                ret.errback(e);
            }
            return ret;
        }
    }
});
exports.Rule = Rule;

//
function _mergePatterns (patterns) {
	//
	return function (patt, i) {
		// [pattern], [pattern], ...  in arrays of length 1
		// we wish to build a single array in order of lhs progression
		if( isArray(patt) ) {
			if( patt.length === 1 ) {
				patt = patt[0];
				i = 0;
			}
			else {
				throw new Error('invalid pattern structure');
			}
		}
		if (!patterns[i]) {
			patterns[i] = i === 0 ? [] : patterns[i - 1].slice();
			//remove dup
			if (i !== 0) {
				patterns[i].pop();
			}
			patterns[i].push(patt);
		} else {
			extd(patterns).forEach(function (p) {
				p.push(patt);
			});
		}
	};
}
//
//
function createRule(name, options, conditions, cb) {
	var rules = [], scope, patterns, isComposite;

	function processConditions(conditions, scope) {
		var l			= conditions.length, 
			merged		= [],
			fnMerge		= _mergePatterns(merged),
			isRules		= extd.every(conditions, function (cond) {return isArray(cond);}),
			condition, rules, patterns;
		//
		if( isRules && conditions.length === 1 ) {
			isRules = false; 
		}
		//
		function isSinglePattern(patterns) {
			var ret = true;
			if( patterns.length > 1 ) {
				if( isArray(patterns[0])  ) {
					ret = false;
				}
				// else it's OR [ p, p,...] which we treat as a single rule which results in multiple rules
			}
			return ret;
		}
		//
		function patternFormCondition(condition, scope) {
			var patterns;
			condition.scope = scope;
			patterns = parsePattern(condition);	
			return patterns;
		}
		//
		function compositePattern(patterns) {
			
			return extd.map(merged, function (patterns) {
				var compPat = null;
				for (var i = 0; i < patterns.length; i++) {
					if (compPat === null) {
						compPat = new CompositePattern(patterns[i++], patterns[i]);
					} else {
						compPat = new CompositePattern(compPat, patterns[i]);
					}
				}
				if( !ruleFactory ) {
					return new Rule(name, options, compPat, cb);
				}
				else  {
					return ruleFactory(name, options, compPat, cb);
				}
			});
		}
		//
		function singlePattern(pattern) {
			return extd.map(patterns, function (cond) {
				if( !ruleFactory ) {
						return new Rule(name, options, cond, cb);
				}
				else {
						return ruleFactory(name, options, cond, cb);
					}
			});
		}
		//
		if( isRules ) {
			for (var i = 0; i < l; i++) {
				condition = conditions[i];
				condition.scope = scope;
				patterns = patternFormCondition(condition, scope);
				extd.forEach( patterns, fnMerge );
			}
			rules = compositePattern(merged);
		}
		else {
			patterns = patternFormCondition(conditions[0], scope);
			if( isSinglePattern(patterns) ) {
				rules = singlePattern(patterns);
			}
			else {
				extd.forEach( patterns, fnMerge );
				rules = compositePattern(merged);
			}
		}
		return rules;
	}
	//
	if (isArray(options)) {
		cb = conditions;
		conditions = options;
	} else {
		options = options || {};
	}
	scope = options.scope || {};
	return processConditions(conditions, scope);
}
exports.createRule = createRule;

