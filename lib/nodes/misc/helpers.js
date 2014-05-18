exports.getMemory = (function () {

    var pPush = Array.prototype.push, NPL = 0, EMPTY_ARRAY = [], NOT_POSSIBLES_HASH = {}, POSSIBLES_HASH = {}, PL = 0;

    function mergePossibleTuples(ret, a, l) {
        var val, j = 0, i = -1;
        if (PL < l) {
            while (PL && ++i < l) {
                if (POSSIBLES_HASH[(val = a[i]).hashCode]) {
                    ret[j++] = val;
                    PL--;
                }
            }
        } else {
            pPush.apply(ret, a);
        }
        PL = 0;
        POSSIBLES_HASH = {};
    }


    function mergeNotPossibleTuples(ret, a, l) {
        var val, j = 0, i = -1;
        if (NPL < l) {
            while (++i < l) {
                if (!NPL) {
                    ret[j++] = a[i];
                } else if (!NOT_POSSIBLES_HASH[(val = a[i]).hashCode]) {
                    ret[j++] = val;
                } else {
                    NPL--;
                }
            }
        }
        NPL = 0;
        NOT_POSSIBLES_HASH = {};
    }

    function mergeBothTuples(ret, a, l) {
        if (PL === l) {
            mergeNotPossibles(ret, a, l);
        } else if (NPL < l) {
            var val, j = 0, i = -1, hashCode;
            while (++i < l) {
                if (!NOT_POSSIBLES_HASH[(hashCode = (val = a[i]).hashCode)] && POSSIBLES_HASH[hashCode]) {
                    ret[j++] = val;
                }
            }
        }
        NPL = 0;
        NOT_POSSIBLES_HASH = {};
        PL = 0;
        POSSIBLES_HASH = {};
    }

    function mergePossiblesAndNotPossibles(a, l) {
        var ret = EMPTY_ARRAY;
        if (l) {
            if (NPL || PL) {
                ret = [];
                if (!NPL) {
                    mergePossibleTuples(ret, a, l);
                } else if (!PL) {
                    mergeNotPossibleTuples(ret, a, l);
                } else {
                    mergeBothTuples(ret, a, l);
                }
            } else {
                ret = a;
            }
        }
        return ret;
    }

    function getRangeTuples(op, currEntry, val) {
        var ret;
        if (op === "gt") {
            ret = currEntry.findGT(val);
        } else if (op === "gte") {
            ret = currEntry.findGTE(val);
        } else if (op === "lt") {
            ret = currEntry.findLT(val);
        } else if (op === "lte") {
            ret = currEntry.findLTE(val);
        }
        return ret;
    }

    function mergeNotPossibles(tuples, tl) {
        if (tl) {
            var j = -1, hashCode;
            while (++j < tl) {
                hashCode = tuples[j].hashCode;
                if (!NOT_POSSIBLES_HASH[hashCode]) {
                    NOT_POSSIBLES_HASH[hashCode] = true;
                    NPL++;
                }
            }
        }
    }

    function mergePossibles(tuples, tl) {
        if (tl) {
            var j = -1, hashCode;
            while (++j < tl) {
                hashCode = tuples[j].hashCode;
                if (!POSSIBLES_HASH[hashCode]) {
                    POSSIBLES_HASH[hashCode] = true;
                    PL++;
                }
            }
        }
    }

    return function _getMemory(entry, factHash, indexes) {
        var i = -1, l = indexes.length,
            ret = entry.tuples,
            rl = ret.length,
            intersected = false,
            tables = entry.tables,
            index, val, op, nextEntry, currEntry, tuples, tl;
        while (++i < l && rl) {
            index = indexes[i];
            val = index[3](factHash);
            op = index[4];
            currEntry = tables[index[0]];
            if (op === "eq" || op === "seq") {
                if ((nextEntry = currEntry.get(val))) {
                    rl = (ret = (entry = nextEntry).tuples).length;
                    tables = nextEntry.tables;
                } else {
                    rl = (ret = EMPTY_ARRAY).length;
                }
            } else if (op === "neq" || op === "sneq") {
                if ((nextEntry = currEntry.get(val))) {
                    tl = (tuples = nextEntry.tuples).length;
                    mergeNotPossibles(tuples, tl);
                }
            } else if (!intersected) {
                rl = (ret = getRangeTuples(op, currEntry, val)).length;
                intersected = true;
            } else if ((tl = (tuples = getRangeTuples(op, currEntry, val)).length)) {
                mergePossibles(tuples, tl);
            } else {
                ret = tuples;
                rl = tl;
            }
        }
        return mergePossiblesAndNotPossibles(ret, rl);
    };
}());