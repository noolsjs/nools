/*jshint evil:true*/
"use strict";
var extd = require("../extended"),
    parser = require("../parser"),
    constraintMatcher = require("../constraintMatcher.js"),
    indexOf = extd.indexOf,
    forEach = extd.forEach,
    removeDuplicates = extd.removeDuplicates,
    map = extd.map,
    obj = extd.hash,
    keys = obj.keys,
    merge = extd.merge,
    rules = require("../rule"),
    common = require("./common"),
    modifiers = common.modifiers,
    createDefined = common.createDefined,
    createFunction = common.createFunction;


/**
 * @private
 * Parses an action from a rule definition
 * @param {String} action the body of the action to execute
 * @param {Array} identifiers array of identifiers collected
 * @param {Object} defined an object of defined
 * @param scope
 * @return {Object}
 */
var parseAction = function (action, identifiers, defined, scope) {
    var declares = [];
    forEach(identifiers, function (i) {
        if (action.indexOf(i) !== -1) {
            declares.push("var " + i + "= facts." + i + ";");
        }
    });
    extd(defined).keys().forEach(function (i) {
        if (action.indexOf(i) !== -1) {
            declares.push("var " + i + "= defined." + i + ";");
        }
    });

    extd(scope).keys().forEach(function (i) {
        if (action.indexOf(i) !== -1) {
            declares.push("var " + i + "= scope." + i + ";");
        }
    });
    extd(modifiers).forEach(function (i) {
        if (action.indexOf(i) !== -1) {
            declares.push("if(!" + i + "){ var " + i + "= flow." + i + ";}");
        }
    });
    var params = ["facts", 'flow'];
    if (/next\(.*\)/.test(action)) {
        params.push("next");
    }
    action = declares.join("") + action;
    try {
        return new Function("defined, scope", "return " + new Function(params.join(","), action).toString())(defined, scope);
    } catch (e) {
        throw new Error("Invalid action : " + action + "\n" + e.message);
    }
};

var createRuleFromObject = (function () {
    var __resolveRule = function (rule, identifiers, conditions, defined, name) {
        var condition = [], definedClass = rule[0], alias = rule[1], constraint = rule[2], refs = rule[3];
        if (extd.isHash(constraint)) {
            refs = constraint;
            constraint = null;
        }
        if (definedClass && !!(definedClass = defined[definedClass])) {
            condition.push(definedClass);
        } else {
            throw new Error("Invalid class " + rule[0] + " for rule " + name);
        }
        condition.push(alias, constraint, refs);
        conditions.push(condition);
        identifiers.push(alias);
        if (constraint) {
            forEach(constraintMatcher.getIdentifiers(parser.parseConstraint(constraint)), function (i) {
                identifiers.push(i);
            });
        }
        if (extd.isObject(refs)) {
            for (var j in refs) {
                var ident = refs[j];
                if (indexOf(identifiers, ident) === -1) {
                    identifiers.push(ident);
                }
            }
        }
    };

    function parseRule(rule, conditions, identifiers, defined, name) {
        if (rule.length) {
            var r0 = rule[0];
            if (r0 === "not" || r0 === "exists") {
                var temp = [];
                rule.shift();
                __resolveRule(rule, identifiers, temp, defined, name);
                var cond = temp[0];
                cond.unshift(r0);
                conditions.push(cond);
            } else if (r0 === "or") {
                var conds = [r0];
                rule.shift();
                forEach(rule, function (cond) {
                    parseRule(cond, conds, identifiers, defined, name);
                });
                conditions.push(conds);
            } else {
                __resolveRule(rule, identifiers, conditions, defined, name);
                identifiers = removeDuplicates(identifiers);
            }
        }

    }

    return function (obj, defined, scope) {
        var name = obj.name;
        if (extd.isEmpty(obj)) {
            throw new Error("Rule is empty");
        }
        var options = obj.options || {};
        options.scope = scope;
        var constraints = obj.constraints || [], l = constraints.length;
        if (!l) {
            constraints = ["true"];
        }
        var action = obj.action;
        if (extd.isUndefined(action)) {
            throw new Error("No action was defined for rule " + name);
        }
        var conditions = [], identifiers = [];
        forEach(constraints, function (rule) {
            parseRule(rule, conditions, identifiers, defined, name);
        });
        return rules.createRule(name, options, conditions, parseAction(action, identifiers, defined, scope));
    };
})();

exports.parse = function (src, file) {
    //parse flow from file
    return parser.parseRuleSet(src, file);

};
exports.compile = function (flowObj, options, cb, Container) {
    if (extd.isFunction(options)) {
        cb = options;
        options = {};
    } else {
        options = options || {};
    }
    var name = flowObj.name || options.name;
    //if !name throw an error
    if (!name) {
        throw new Error("Name must be present in JSON or options");
    }
    var flow = new Container(name);
    var defined = merge({Array: Array, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Date: Date, Object: Object}, options.define || {});
    if (typeof Buffer !== "undefined") {
        defined.Buffer = Buffer;
    }
    var scope = merge({console: console}, options.scope);
    //add the anything added to the scope as a property
    forEach(flowObj.scope, function (s) {
        scope[s.name] = true;
    });
    //add any defined classes in the parsed flowObj to defined
    forEach(flowObj.define, function (d) {
        defined[d.name] = createDefined(d, defined, scope);
    });

    //expose any defined classes to the flow.
    extd(defined).forEach(function (cls, name) {
        flow.addDefined(name, cls);
    });

    var scopeNames = extd(flowObj.scope).pluck("name").union(extd(scope).keys().value()).value();
    var definedNames = map(keys(defined), function (s) {
        return s;
    });
    forEach(flowObj.scope, function (s) {
        scope[s.name] = createFunction(s.body, defined, scope, scopeNames, definedNames);
    });
    var rules = flowObj.rules;
    if (rules.length) {
        forEach(rules, function (rule) {
            flow.__rules = flow.__rules.concat(createRuleFromObject(rule, defined, scope));
        });
    }
    if (cb) {
        cb.call(flow, flow);
    }
    return flow;
};

exports.transpile = require("./transpile").transpile;



