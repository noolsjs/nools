var Node = require("./node"),
    constraints = require("../constraint"),
    ReferenceEqualityConstraint = constraints.ReferenceEqualityConstraint;

var DEFUALT_CONSTRAINT = {
    isDefault: true,
    assert: function () {
        return true;
    },

    equal: function () {
        return false;
    }
};

var inversions = {
    "gt": "lte",
    "gte": "lte",
    "lt": "gte",
    "lte": "gte",
    "eq": "eq",
    "neq": "neq"
};

function normalizeRightIndexConstraint(rightIndex, indexes, op) {
    if (rightIndex === indexes[1]) {
        op = inversions[op];
    }
    return op;
}

function normalizeLeftIndexConstraint(leftIndex, indexes, op) {
    if (leftIndex === indexes[1]) {
        op = inversions[op];
    }
    return op;
}

Node.extend({

    instance: {

        constraint: DEFUALT_CONSTRAINT,

        constructor: function (leftMemory, rightMemory) {
            this._super(arguments);
            this.constraint = DEFUALT_CONSTRAINT;
            this.constraintAssert = DEFUALT_CONSTRAINT.assert;
            this.rightIndexes = [];
            this.leftIndexes = [];
            this.constraintLength = 0;
            this.leftMemory = leftMemory;
            this.rightMemory = rightMemory;
        },

        addConstraint: function (constraint) {
            if (constraint instanceof ReferenceEqualityConstraint) {
                var identifiers = constraint.getIndexableProperties();
                var alias = constraint.get("alias");
                if (identifiers.length === 2 && alias) {
                    var leftIndex, rightIndex, i = -1, indexes = [];
                    while (++i < 2) {
                        var index = identifiers[i];
                        if (index.match(new RegExp("^" + alias + "(\\.?)")) === null) {
                            indexes.push(index);
                            leftIndex = index;
                        } else {
                            indexes.push(index);
                            rightIndex = index;
                        }
                    }
                    if (leftIndex && rightIndex) {
                        var leftOp = normalizeLeftIndexConstraint(leftIndex, indexes, constraint.op),
                            rightOp = normalizeRightIndexConstraint(rightIndex, indexes, constraint.op);
                        this.rightMemory.addIndex(rightIndex, leftIndex, rightOp);
                        this.leftMemory.addIndex(leftIndex, rightIndex, leftOp);
                    }
                }
            }
            if (this.constraint.isDefault) {
                this.constraint = constraint;
                this.isDefault = false;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.constraintAssert = this.constraint.assert;

        },

        equal: function (constraint) {
            return this.constraint.equal(constraint.constraint);
        },

        isMatch: function (lc, rc) {
            return this.constraintAssert(lc.factHash, rc.factHash);
        },

        match: function (lc, rc) {
            var ret = {isMatch: false};
            if (this.constraintAssert(lc.factHash, rc.factHash)) {
                ret = lc.match.merge(rc.match);
            }
            return ret;
        }

    }

}).as(module);