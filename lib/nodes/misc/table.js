var extd = require("../../extended"),
    pPush = Array.prototype.push,
    HashTable = extd.HashTable,
    AVLTree = extd.AVLTree;

function compare(a, b) {
    /*jshint eqeqeq: false*/
    a = a.key;
    b = b.key;
    var ret;
    if (a == b) {
        ret = 0;
    } else if (a > b) {
        ret = 1;
    } else if (a < b) {
        ret = -1;
    } else {
        ret = 1;
    }
    return ret;
}

function compareGT(v1, v2) {
    return compare(v1, v2) === 1;
}
function compareGTE(v1, v2) {
    return compare(v1, v2) !== -1;
}

function compareLT(v1, v2) {
    return compare(v1, v2) === -1;
}
function compareLTE(v1, v2) {
    return compare(v1, v2) !== 1;
}

var STACK = [],
    VALUE = {key: null};
function traverseInOrder(tree, key, comparator) {
    VALUE.key = key;
    var ret = [];
    var i = 0, current = tree.__root, v;
    while (true) {
        if (current) {
            current = (STACK[i++] = current).left;
        } else {
            if (i > 0) {
                v = (current = STACK[--i]).data;
                if (comparator(v, VALUE)) {
                    pPush.apply(ret, v.value.tuples);
                    current = current.right;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    STACK.length = 0;
    return ret;
}

function traverseReverseOrder(tree, key, comparator) {
    VALUE.key = key;
    var ret = [];
    var i = 0, current = tree.__root, v;
    while (true) {
        if (current) {
            current = (STACK[i++] = current).right;
        } else {
            if (i > 0) {
                v = (current = STACK[--i]).data;
                if (comparator(v, VALUE)) {
                    pPush.apply(ret, v.value.tuples);
                    current = current.left;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    STACK.length = 0;
    return ret;
}

AVLTree.extend({
    instance: {

        constructor: function () {
            this._super([
                {
                    compare: compare
                }
            ]);
            this.gtCache = new HashTable();
            this.gteCache = new HashTable();
            this.ltCache = new HashTable();
            this.lteCache = new HashTable();
            this.hasGTCache = false;
            this.hasGTECache = false;
            this.hasLTCache = false;
            this.hasLTECache = false;
        },

        clearCache: function () {
            this.hasGTCache && this.gtCache.clear() && (this.hasGTCache = false);
            this.hasGTECache && this.gteCache.clear() && (this.hasGTECache = false);
            this.hasLTCache && this.ltCache.clear() && (this.hasLTCache = false);
            this.hasLTECache && this.lteCache.clear() && (this.hasLTECache = false);
        },

        contains: function (key) {
            return  this._super([
                {key: key}
            ]);
        },

        "set": function (key, value) {
            this.insert({key: key, value: value});
            this.clearCache();
        },

        "get": function (key) {
            var ret = this.find({key: key});
            return ret && ret.value;
        },

        "remove": function (key) {
            this.clearCache();
            return this._super([
                {key: key}
            ]);
        },

        findGT: function (key) {
            var ret = this.gtCache.get(key);
            if (!ret) {
                this.hasGTCache = true;
                this.gtCache.put(key, (ret = traverseReverseOrder(this, key, compareGT)));
            }
            return ret;
        },

        findGTE: function (key) {
            var ret = this.gteCache.get(key);
            if (!ret) {
                this.hasGTECache = true;
                this.gteCache.put(key, (ret = traverseReverseOrder(this, key, compareGTE)));
            }
            return ret;
        },

        findLT: function (key) {
            var ret = this.ltCache.get(key);
            if (!ret) {
                this.hasLTCache = true;
                this.ltCache.put(key, (ret = traverseInOrder(this, key, compareLT)));
            }
            return ret;
        },

        findLTE: function (key) {
            var ret = this.lteCache.get(key);
            if (!ret) {
                this.hasLTECache = true;
                this.lteCache.put(key, (ret = traverseInOrder(this, key, compareLTE)));
            }
            return ret;
        }

    }
}).as(module);