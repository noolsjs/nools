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
    ObjectPattern = pattern.ObjectPattern,
    FromPattern = pattern.FromPattern,
    NotPattern = pattern.NotPattern,
    ExistsPattern = pattern.ExistsPattern,
    FromNotPattern = pattern.FromNotPattern,
    FromExistsPattern = pattern.FromExistsPattern,
    CompositePattern = pattern.CompositePattern,
	ParamPattern = pattern.ParamPattern,
	CollectPattern = pattern.CollectPattern;

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
	.containsAt("query", 0, function(condition) {
		var params = condition[1]									// params.name, params.arguments, params.conditions
			,paramPattern, compPat, collectPattern, setOrientedAliases = [], patterns = [], queryFn,rhsFn, tmp, bottom;	
		/**
			in order to build hashCode from parameters helper code must be introduced into the caller
			a.) the session must be available either directly or transitively via the agenda
			b.) the RHS must be called with a Match instance, not a fact hash from a context/match instance
			c.) the session must maintain a query hash for results by query name,that is patitioned by parameter hash-code(s)
		*/
		function buildRHS(name, paramPatterns) {
			var wrapper		= ['return ', undefined]						// function QueryWrapper(paramPatterns) { return fn(match) {...};  }
				,fnSig		= ['function ', name, '_RHS(match)'].join('')
				,fnQuery	= [fnSig, '{', 
											'var session = this, nFacts = match.factIds.length, factIds=[], existing, idx, hashCode, collection;', 
											 undefined,		// idx = match.aliases.indexOf(param.alias); factIds.push(match.factIds[idx]);
											 'hashCode = factIds.join(":");',						// results partitioned by param id's
											 'if(!(session.queryResults[name][hashCode])) {',
											 'session.queryResults[name][hashCode] = (match.facts[nFacts-1]).object;',		// collection always last
											 '}',
									'}']
				,tmp, wrapperFn, queryFn; 
			//
			// build the fn body, params are in order,always first because we generate the calling fn ( below ) 
			// we also know there are n+1 facts in the match, with n = # of params which is  >= 1; since
			// queries with no parameters have an auto generated 'fake' parameter, this results in a single collection fact
			// that is always last since the Match instance pushes facts
			tmp = [];
			paramPatterns.forEach(function(param) {
				var paramExpr = ['idx = match.aliases.indexOf("',param.alias,'"); factIds.push(match.factIds[idx]);'];
				tmp.push(paramExpr.join(''));
			}); 
			fnQuery[3]  = tmp.join('\n');
			fnQuery		= fnQuery.join('\n');
			wrapper[1]	= fnQuery;
			wrapper		= wrapper.join('');		  
			//
			wrapperFn = new Function(['name'], wrapper);
			queryFn = wrapperFn(name);
			return queryFn;			
		}
		/*
			The query function is call-able as a condition in an rule's LHS. 
			Query condition is converted to a from queryFn(params);
			//
			ex: list : Array [ expresson ] from MsgFilter($varA, $varB,...);// the from modifier can be omitted for brevity
		*/
		function buildQuery(name, paramPatterns) {
			var wrapper		= ['return ', undefined]						// function QueryWrapper(paramPatterns) {  }
				,fnSig		= ['function ', name, '(', undefined, ')']
				,fnQuery	= [undefined, '{', 'var session = this;', undefined, '}']
				,paramExpr  = ['paramPatterns["', undefined, '"].setParam(session,', undefined, ');']
				,tmp, wrapperFn, queryFn; 
			//
			// build the signature
			tmp = [];
			paramPatterns.forEach(function(param) {
				tmp.push(param.alias);
			});  
			fnSig[3] = tmp.join(',');
			fnQuery[0] = fnSig = fnSig.join('');
			//
			// build the query fn body
			tmp = [];
			paramPatterns.forEach(function(param) {
				var a = ['paramPatterns["', param.alias, '"].setParam(', param.alias, ');'];
				paramExpr[1] = param.alias; paramExpr[3] = param.alias;
				tmp.push(paramExpr.join(''));
			}); 
			fnQuery[3]  = tmp.join('\n');
			fnQuery		= fnQuery.join('\n');
			wrapper[1]	= fnQuery;
			wrapper		= wrapper.join('');		  
			//
			wrapperFn = new Function(['paramPatterns'], wrapper);
			// we need a hash of param patterns not an array
			tmp = {};
			paramPatterns.forEach(function(pattern) { tmp[pattern.alias] = pattern; });
			queryFn = wrapperFn(tmp);
			return queryFn;
		}
		//
		// ParamPattern extends the from pattern, it is an alternate source (instead of working memory) of facts/arguments
		if( params.arguments ) {
			params.arguments.forEach(function(arg) {
				var nCond = normailizeConstraint(arg);				// arg as simple condition; e.g. 'msg' : String , ParamPattern extends from;
				patterns.push( new ParamPattern(getParamType(nCond[0], condition.scope),nCond[1], condition.scope) );
			});
		}
		else {		// there is no parameter produce a fake, the InitialParam ( like the initial fact ) since params are query; trigger/blocker
			patterns.push( new ParamPattern(Object, 'auto', condition.scope) );
		}
		//
		// now that we have the parameters we can build the Query Function
		// the query fn is kept in the flow like scope so it can be referenced in rule lhs
		queryFn = buildQuery(params.name, patterns);
		rhsFn	= buildRHS(params.name, patterns);
		//
		// parse the (non parameter) query conditions
		params.conditions.forEach(function(condition) {
			var pattern = parsePattern(condition)[0];		// pattern from query condition
			setOrientedAliases.push(pattern.alias);		// this alias is a set which the (bottom) collect node will accumulate
			patterns.push( pattern );				
		});
		//
		// build from bottom;e.g. closest to terminal node; all bound vars are sets (except for params) which exist as conditions preceding query constraints
		collectPattern = new CollectPattern(Array, 'list', 'true', {}, {scope: condition.scope, pattern: 'true'});
		collectPattern.setOrientedAliases = setOrientedAliases;		// used to distinguish condtions from argument(s)
		//
		tmp = [];
		patterns.push(collectPattern);				
		for (var i = 0; i < patterns.length; i++) {
			if (!compPat) {						// left,	right
				compPat = new CompositePattern(patterns[i], patterns[++i]);
			} else {
				compPat = new CompositePattern(compPat, patterns[i]);
			}
			tmp.push(compPat);
		}
		//
		bottom				= tmp[tmp.length-1];
		bottom.queryFn		= queryFn;
		bottom.rhsFn		= rhsFn;
		bottom.queryName	= params.name;
		return [bottom];			
	})
    .def(function (condition) {
        if (typeof condition === 'function') {
            return [condition];
        }
        condition = normailizeConstraint(condition);
        if (condition[4] && condition[4].from) {
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
//
exports.parsePattern = parsePattern;

var Rule = declare({
    instance: {
        constructor: function (name, options, pattern, cb) {
            this.name = name;
            this.pattern = pattern;
            this.cb = cb;
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

var Query = Rule.extend({
    instance: {
		constructor: function (name, options, pattern) {
            this._super([name, options, pattern,pattern.rhsFn]);
        },
        fire: function (flow, match) {
            var ret = new Promise(), cb = this.cb;
            try {
                if (cb.length === 3) {
                    cb.call(flow, match, flow, ret.resolve);
                } else {
                    ret = cb.call(flow, match, flow);
                }
            } catch (e) {
                ret.errback(e);
            }
            return ret;
        }
    }
});

function createRule(name, options, conditions, cb) {
    if (isArray(options)) {
        cb = conditions;
        conditions = options;
    } else {
        options = options || {};
    }
    var isRules = extd.every(conditions, function (cond) {
        return isArray(cond);
    });
    if (isRules && conditions.length === 1) {
        conditions = conditions[0];
        isRules = false;
    }
    var rules = [];
    var scope = options.scope || {};
	var instance;
    conditions.scope = scope;
    if (isRules) {
        var _mergePatterns = function (patt, i) {
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
        var l = conditions.length, patterns = [], condition;
        for (var i = 0; i < l; i++) {
            condition = conditions[i];
            condition.scope = scope;
            extd.forEach(parsePattern(condition), _mergePatterns);

        }
        rules = extd.map(patterns, function (patterns) {
            var compPat = null;
            for (var i = 0; i < patterns.length; i++) {
                if (compPat === null) {
                    compPat = new CompositePattern(patterns[i++], patterns[i]);
                } else {
                    compPat = new CompositePattern(compPat, patterns[i]);
                }
            }
			if(compPat.queryName) {
				return new Query(name, options, compPat);
			}
			else {
				return new Rule(name, options, compPat, cb);
			}
        });
    } else {
        rules = extd.map(parsePattern(conditions), function (cond) {
			if(cond.queryName) {
				return new Query(name, options, cond);
			}
			else {
				return new Rule(name, options, cond, cb);
			}        
		});
    }
    return rules;
}

exports.createRule = createRule;


function createQuery(name, options, conditions) {
	var wrapper = {name: name, arguments: undefined, conditions: conditions}, args, rule;
	if( extd.isArray(options) ) {
		conditions = options;
	}
	options = options || {};
	if( extd.isObject(options.arguments) ) {	// create an args pattern(s)
		args = [];
		extd(options.arguments).forEach(function(val, key) {
			args.push([val, key]);
		});
		wrapper.arguments = args;
	}
	conditions = ['query', wrapper];
	return createRule(name, options, conditions)[0];
}

exports.createQuery = createQuery;

