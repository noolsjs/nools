var arr = require("array-extended"),
    map = arr.map;

function plucked(prop) {
    var exec = prop.match(/(\w+)\(\)$/);
    if (exec) {
        prop = exec[1];
        return function (item) {
            return item[prop]();
        };
    } else {
        return function (item) {
            return item[prop];
        };
    }
}

function plucker(prop) {
    prop = prop.split(".");
    if (prop.length === 1) {
        return plucked(prop[0]);
    } else {
        var pluckers = map(prop, function (prop) {
            return plucked(prop);
        });
        var l = pluckers.length;
        return function (item) {
            var i = -1, res = item;
            while (++i < l) {
                res = pluckers[i](res);
            }
            return res;
        };
    }
}

module.exports = require("extended")()
    .register(arr)
    .register(require("date-extended"))
    .register(require("object-extended"))
    .register(require("string-extended"))
    .register(require("promise-extended"))
    .register(require("function-extended"))
    .register(require("is-extended"))
    .register("plucker", plucker)
    .register("HashTable", require("ht"))
    .register("declare", require("declare.js"))
    .register(require("leafy"))
    .register("LinkedList", require("./linkedList"));

