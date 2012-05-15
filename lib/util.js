var comb = require("comb"),
    rule = require("./rule");

exports.parse = function (file, options, cb, Container) {
    if (comb.isFunction(options)) {
        cb = options;
        options = {};
    } else {
        options = options || {};
        cb = null;
    }
    try {
        //parse flow from file
        var flowObj = require(file);
    } catch (e) {
        throw new Error("Invalid flow defintion", e);
    }
    var name = flowObj.name || options.name;
    //if !name throw an error
    if (!name) {
        throw new Error("Name must be present in JSON or options");
    }
    var flow = new Container(name);
    var defined = flowObj.define;
    if (!defined) {
        defined = options.define;
    } else {
        for (var j in defined) {
            defined[j] = createDefined(j, defined[j], flow);
        }
    }
    if (!comb.isObject(defined)) {
        throw new Error("Object references must be defined in JSON or options");
    }

    delete flowObj.name;
    delete flowObj.define;
    var keys = Object.keys(flowObj), l = keys.length;
    if (!keys.length) {
        //log a warning as this is probably a mistake
        console.warn("No rules were defined in JSON");
    }
    for (var i = 0; i < l; i++) {
        var key = keys[i], rul = flowObj[key];
        flow.__rules = flow.__rules.concat(rule.createRuleFromObject(key, rul, defined));
    }
    cb && cb.call(flow, flow);
    return flow;

};

var createArrayDefined = function (options) {
    return function (opts) {
        opts = opts || {};
        options.forEach(function (i) {
            var opt = opts[i];
            this[i] = comb.isDefined(opt) ? opt : null;
        }, this);
    }
};

var createObjectDefined = function (options) {
    var functions = options.functions || {};
    var properties = options.properties || options;
    if (comb.isArray(properties)) {
        ret = createArrayDefined(properties);
    } else {
        var ret = function (opts) {
            opts = opts || {};
            for (var i in properties) {
                var def = properties[i] || null;
                if (comb.isObject(def)) {
                    var key = Object.keys(def)[0];
                    if (key == "$date") {
                        var val = def[key];
                        if (val == "now" || val == "now()") {
                            def = new Date();
                        } else if (comb.isString(val)) {
                            def = Date.parse(val);
                        } else {
                            def = new Date(val);
                        }
                    } else if (key == "$regexp") {
                        def = new RegExp(def[key]);
                    }
                }
                var opt = opts[i];
                this[i] = comb.isDefined(opt) ? opt : def;
            }
        };
    }
    for (var i in functions) {
        var f = functions[i];
        comb.isArray(f) && (f = f.join(""));
        if (f.indexOf("function") != 0) {
            f = ["function(){\n\t", f, "\n}"].join("");
        }
        try {
            ret.prototype[i] = eval(["(", f, ")"].join(""));
        } catch (e) {
            throw new Error("Invalid function : " + f, e);
        }
    }
    return ret;
};

var createDefined = function (name, options, flow) {
    var ret;
    if (comb.isArray(options)) {
        flow.addDefined(name, (ret = createArrayDefined(options)));
    } else if (comb.isObject(options) && !comb.isEmpty(options)) {
        flow.addDefined(name, (ret = createObjectDefined(options)));
    } else {
        throw new Error("Invalid defined object definition : " + name + " : " + options);
    }
    return ret;
};