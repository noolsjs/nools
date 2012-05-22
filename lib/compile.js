(function () {
    "use strict";
    var comb = require("comb"),
        fs = require("fs"),
        path = require("path"),
        parser = require("./parser"),
        constraintMatcher = require("./constraintMatcher.js"),
        removeDuplicates = comb.array.removeDuplicates,
        rules = require("./rule");

    var modifiers = ["assert", "modify", "retract"];
    var parseAction = function (action, identifiers, defined) {
        var declares = [], needFlow = false;
        identifiers.forEach(function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= facts." + i + ";");
            }
        });
        modifiers.forEach(function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= flow." + i + ".bind(flow);");
            }
        });
        Object.keys(defined).forEach(function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= defined." + i + ";");
            }
        });
        var params = ["facts", 'flow'];
        if (/next\(.*\)/.test(action)) {
            params.push("next");
        }
        action = declares.join("") + action;
        action = ["(function(", params.join(","), ")", "{\n\t", action, "\n})"].join("");
        try {
            return eval(action);
        } catch (e) {
            throw new Error("Invalid action : " + action + "\n" + e.message);
        }
    };

    var createRuleFromObject = function (obj, defined) {
        var name = obj.name;
        if (comb.isEmpty(obj)) {
            throw new Error("Rule is empty");
        }
        var options = obj.options || {};
        var constraints = obj.constraints || [], l = constraints.length;
        if (!l) {
            throw new Error("no rules defined for rule " + name);
        }
        var action = obj.action;
        if (comb.isUndefined(action)) {
            throw new Error("No action was defined for rule " + name);
        }
        var conditions = [], identifiers = [];
        for (var i = 0; i < l; i++) {
            var rule = constraints[i], condition = [];
            if (rule.length) {
                var r0 = rule[0];
                if (r0 === "not" || r0 === "or") {
                    condition.push(r0);
                    rule.shift();
                }
                var definedClass = rule[0], alias = rule[1], constraint = rule[2], refs = rule[3];
                if (comb.isHash(constraint)) {
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
                    identifiers = identifiers.concat(constraintMatcher.getIdentifiers(parser.parseConstraint(constraint)));
                }
                if (comb.isObject(refs)) {
                    for (var j in refs) {
                        var ident = refs[j];
                        if (identifiers.indexOf(ident) === -1) {
                            identifiers.push(ident);
                        }
                    }
                }
                identifiers = removeDuplicates(identifiers);
            }
        }
        return rules.createRule(name, options, conditions, parseAction(action, identifiers, defined));
    };

    exports.compile = function (file, options, cb, Container) {
        if (comb.isFunction(options)) {
            cb = options;
            options = {};
        } else {
            options = options || {};
            cb = null;
        }
        var flowObj;

        //parse flow from file
        flowObj = parser.parseRuleSet(fs.readFileSync(file, "utf8"));

        var name = flowObj.name || options.name || path.basename(file, path.extname(file));
        //if !name throw an error
        if (!name) {
            throw new Error("Name must be present in JSON or options");
        }
        var flow = new Container(name);
        var defined = {Array:Array, String:String, Number:Number, Boolean:Boolean, RegExp:RegExp, Buffer:Buffer};
        if (!defined) {
            defined = options.define;
        } else {
            flowObj.define.forEach(function (d) {
                defined[d.name] = createDefined(d, flow);
            });
        }
        var rules = flowObj.rules, l = rules.length;
        if (rules.length) {
            rules.forEach(function (rule) {
                flow.__rules = flow.__rules.concat(createRuleFromObject(rule, defined));
            });
        }
        if (cb) {
            cb.call(flow, flow);
        }
        return flow;

    };

    var createDefined = (function () {

        var _createDefined = function (options) {
            var ret = options.hasOwnProperty("constructor") && "function" === typeof options.constructor ? options.constructor : function (opts) {
                opts = opts || {};
                for (var i in opts) {
                    if (i in options) {
                        this[i] = opts[i];
                    }
                }
            };
            var proto = ret.prototype;
            for (var i in options) {
                proto[i] = options[i];
            }
            return ret;

        };

        return function (options, flow) {
            return flow.addDefined(options.name, _createDefined(options.properties));
        };
    })();
})();