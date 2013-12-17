var arr = require("array-extended"),
    unique = arr.unique,
    indexOf = arr.indexOf,
    map = arr.map,
    pSlice = Array.prototype.slice,
    pSplice = Array.prototype.splice;

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

function intersection(a, b) {
    a = pSlice.call(a);
    var aOne, i = -1, l;
    l = a.length;
    while (++i < l) {
        aOne = a[i];
        if (indexOf(b, aOne) === -1) {
            pSplice.call(a, i--, 1);
            l--;
        }
    }
    return a;
}

function inPlaceIntersection(a, b) {
    var aOne, i = -1, l;
    l = a.length;
    while (++i < l) {
        aOne = a[i];
        if (indexOf(b, aOne) === -1) {
            pSplice.call(a, i--, 1);
            l--;
        }
    }
    return a;
}

function inPlaceDifference(a, b) {
    var aOne, i = -1, l;
    l = a.length;
    while (++i < l) {
        aOne = a[i];
        if (indexOf(b, aOne) !== -1) {
            pSplice.call(a, i--, 1);
            l--;
        }
    }
    return a;
}

function diffArr(arr1, arr2) {
    var ret = [], i = -1, j, l2 = arr2.length, l1 = arr1.length, a, found;
    if (l2 > l1) {
        ret = arr1.slice();
        while (++i < l2) {
            a = arr2[i];
            j = -1;
            l1 = ret.length;
            while (++j < l1) {
                if (ret[j] === a) {
                    ret.splice(j, 1);
                    break;
                }
            }
        }
    } else {
        while (++i < l1) {
            a = arr1[i];
            j = -1;
            found = false;
            while (++j < l2) {
                if (arr2[j] === a) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                ret.push(a);
            }
        }
    }
    return ret;
}

function diffHash(h1, h2) {
    var ret = {};
    for (var i in h1) {
        if (!hasOwnProperty.call(h2, i)) {
            ret[i] = h1[i];
        }
    }
    return ret;
}


function union(arr1, arr2) {
    return unique(arr1.concat(arr2));
}

module.exports = require("extended")()
    .register(require("date-extended"))
    .register(arr)
    .register(require("object-extended"))
    .register(require("string-extended"))
    .register(require("promise-extended"))
    .register(require("function-extended"))
    .register(require("is-extended"))
    .register("intersection", intersection)
    .register("inPlaceIntersection", inPlaceIntersection)
    .register("inPlaceDifference", inPlaceDifference)
    .register("diffArr", diffArr)
    .register("diffHash", diffHash)
    .register("unionArr", union)
    .register("plucker", plucker)
    .register("HashTable", require("ht"))
    .register("declare", require("declare.js"))
    .register(require("leafy"))
    .register("LinkedList", require("./linkedList"));

