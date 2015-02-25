var extd = require("../extended"),
    forEach = extd.forEach,
    indexOf = extd.indexOf,
    merge = extd.merge,
    isString = extd.isString,
    modifiers = require("./common").modifiers,
    constraintMatcher = require("../constraintMatcher"),
    parser = require("../parser");

function definedToJs(options) {
    /*jshint evil:true*/
    options = isString(options) ? new Function("return " + options + ";")() : options;
    var ret = ["(function(){"], value;

    if (options.hasOwnProperty("constructor") && "function" === typeof options.constructor) {
        ret.push("var Defined = " + options.constructor.toString() + ";");
    } else {
        ret.push("var Defined = function(opts){ for(var i in opts){if(opts.hasOwnProperty(i)){this[i] = opts[i];}}};");
    }
    ret.push("var proto = Defined.prototype;");
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            value = options[key];
            ret.push("proto." + key + " = " + (extd.isFunction(value) ? value.toString() : extd.format("%j", value)) + ";");
        }
    }
    ret.push("return Defined;");
    ret.push("}())");
    return ret.join("");

}

function actionToJs(action, identifiers, defined, scope) {
    var declares = [], usedVars = {};
    forEach(identifiers, function (i) {
        if (action.indexOf(i) !== -1) {
            usedVars[i] = true;
            declares.push("var " + i + "= facts." + i + ";");
        }
    });
    extd(defined).keys().forEach(function (i) {
        if (action.indexOf(i) !== -1 && !usedVars[i]) {
            usedVars[i] = true;
            declares.push("var " + i + "= defined." + i + ";");
        }
    });

    extd(scope).keys().forEach(function (i) {
        if (action.indexOf(i) !== -1 && !usedVars[i]) {
            usedVars[i] = true;
            declares.push("var " + i + "= scope." + i + ";");
        }
    });
    extd(modifiers).forEach(function (i) {
        if (action.indexOf(i) !== -1 && !usedVars[i]) {
            declares.push("var " + i + "= flow." + i + ";");
        }
    });
    var params = ["facts", 'flow'];
    if (/next\(.*\)/.test(action)) {
        params.push("next");
    }
    action = declares.join("") + action;
    try {
        return ["function(", params.join(","), "){", action, "}"].join("");
    } catch (e) {
        throw new Error("Invalid action : " + action + "\n" + e.message);
    }
}

function parseConstraintModifier(constraint, ret) {
    if (constraint.length && extd.isString(constraint[0])) {
        var modifier = constraint[0].match(" *(from)");
        if (modifier) {
            modifier = modifier[0];
            switch (modifier) {
            case "from":
                ret.push(', "', constraint.shift(), '"');
                break;
            default:
                throw new Error("Unrecognized modifier " + modifier);
            }
        }
    }
}

function parseConstraintHash(constraint, ret, identifiers) {
    if (constraint.length && extd.isHash(constraint[0])) {
        //ret of options
        var refs = constraint.shift();
        extd(refs).values().forEach(function (ident) {
            if (indexOf(identifiers, ident) === -1) {
                identifiers.push(ident);
            }
        });
        ret.push(',' + extd.format('%j', [refs]));
    }
}

function constraintsToJs(constraint, identifiers) {
    constraint = constraint.slice(0);
    var ret = [];
    if (constraint[0] === "or") {
        ret.push('["' + constraint.shift() + '"');
        ret.push(extd.map(constraint,function (c) {
            return constraintsToJs(c, identifiers);
        }).join(",") + "]");
        return ret;
    } else if (constraint[0] === "not" || constraint[0] === "exists") {
        ret.push('"', constraint.shift(), '", ');
    }
    identifiers.push(constraint[1]);
    ret.push(constraint[0], ', "' + constraint[1].replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    constraint.splice(0, 2);
    if (constraint.length) {
        //constraint
        var c = constraint.shift();
        if (extd.isString(c) && c) {
            ret.push(',"' + c.replace(/\\/g, "\\\\").replace(/"/g, "\\\""), '"');
            forEach(constraintMatcher.getIdentifiers(parser.parseConstraint(c)), function (i) {
                identifiers.push(i);
            });
        } else {
            ret.push(',"true"');
            constraint.unshift(c);
        }
    }
    parseConstraintModifier(constraint, ret);
    parseConstraintHash(constraint, ret, identifiers);
    return '[' + ret.join("") + ']';
}

exports.transpile = function (flowObj, options) {
    options = options || {};
    var ret = [];
    ret.push("(function(){");
    ret.push("return function(options){");
    ret.push("options = options || {};");
    ret.push("var bind = function(scope, fn){return function(){return fn.apply(scope, arguments);};}, defined = {Array: Array, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Date: Date, Object: Object}, scope = options.scope || {};");
    ret.push("var optDefined = options.defined || {}; for(var i in optDefined){defined[i] = optDefined[i];}");
    var defined = merge({Array: Array, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Date: Date, Object: Object}, options.define || {});
    if (typeof Buffer !== "undefined") {
        defined.Buffer = Buffer;
    }
    var scope = merge({console: console}, options.scope);
    ret.push(["return nools.flow('", options.name, "', function(){"].join(""));
    //add any defined classes in the parsed flowObj to defined
    ret.push(extd(flowObj.define || []).map(function (defined) {
        var name = defined.name;
        defined[name] = {};
        return ["var", name, "= defined." + name, "= this.addDefined('" + name + "',", definedToJs(defined.properties) + ");"].join(" ");
    }).value().join("\n"));
    ret.push(extd(flowObj.scope || []).map(function (s) {
        var name = s.name;
        scope[name] = {};
        return ["var", name, "= scope." + name, "= ", s.body, ";"].join(" ");
    }).value().join("\n"));
    ret.push("scope.console = console;\n");


    ret.push(extd(flowObj.rules || []).map(function (rule) {
        var identifiers = [], ret = ["this.rule('", rule.name.replace(/'/g, "\\'"), "'"], options = extd.merge(rule.options || {}, {scope: "scope"});
        ret.push(",", extd.format("%j", [options]).replace(/(:"scope")/, ":scope"));
        if (rule.constraints && !extd.isEmpty(rule.constraints)) {
            ret.push(", [");
            ret.push(extd(rule.constraints).map(function (c) {
                return constraintsToJs(c, identifiers);
            }).value().join(","));
            ret.push("]");
        }
        ret.push(",", actionToJs(rule.action, identifiers, defined, scope));
        ret.push(");");
        return ret.join("");
    }).value().join(""));
    ret.push("});");
    ret.push("};");
    ret.push("}());");
    return ret.join("");
};


