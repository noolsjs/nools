var map = require("./extended").map;

function salience(a, b) {
    return a.rule.priority - b.rule.priority;
}

function bucketCounter(a, b) {
    return a.counter - b.counter;
}

function factRecency(a, b) {
    /*jshint noempty: false*/

    var i = 0;
    var aMatchRecency = a.match.recency,
        bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
    while (aMatchRecency[i] === bMatchRecency[i] && i < aLength && i < bLength && i++) {
    }
    var ret = aMatchRecency[i] - bMatchRecency[i];
    if (!ret) {
        ret = aLength - bLength;
    }
    return ret;
}

function activationRecency(a, b) {
    return a.recency - b.recency;
}

var strategies = {
    salience: salience,
    bucketCounter: bucketCounter,
    factRecency: factRecency,
    activationRecency: activationRecency
};

exports.strategies = strategies;
exports.strategy = function (strats) {
    strats = map(strats, function (s) {
        return strategies[s];
    });
    var stratsLength = strats.length;

    return function (a, b) {
        var i = -1, ret = 0;
        var equal = (a === b) || (a.name === b.name && a.hashCode === b.hashCode);
        if (!equal) {
            while (++i < stratsLength && !ret) {
                ret = strats[i](a, b);
            }
            ret = ret > 0 ? 1 : -1;
        }
        return ret;
    };
};