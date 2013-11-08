var Node = require("./node");

var DEFUALT_CONSTRAINT = {
    isDefault: true,
    assert: function () {
        return true;
    }
};

Node.extend({

    instance: {

        constraint: DEFUALT_CONSTRAINT,
        __lc: null,
        __rc: null,
        __varLength: 0,
        __count: 0,
        __rcMatch: null,
        __lcMatch: null,

        constructor: function () {
            this._super(arguments);
            this.__fh = {};
            this.__variables = [];
            this.isDefault = true;
            this.constraintAssert = DEFUALT_CONSTRAINT.assert;
        },

        setLeftContext: function (lc) {
            this.__lc = lc;
            var match = this.__lcMatch = lc.match;
            if (!this.isDefault) {
                var newFh = match.factHash,
                    fh = this.__fh,
                    prop,
                    vars = this.__variables,
                    i = -1,
                    l = this.__varLength;
                while (++i < l) {
                    prop = vars[i];
                    fh[prop] = newFh[prop];
                }
            }
            return this;
        },

        setRightContext: function (rc) {
            this.__rc = rc;
            this.__rcMatch = rc.match;
            if (!this.isDefault) {
                this.__fh[this.__alias] = rc.fact.object;
            }
            return this;
        },

        clearContexts: function () {
            this.__fh = {};
            this.__lc = null;
            this.__rc = null;
            this.__lcMatch = this.__rcMatch = null;
            return this;
        },

        clearRightContext: function () {
            this.__rc = null;
            this.__fh[this.__alias] = null;
            return this;
        },

        clearLeftContext: function () {
            this.__lc = null;
            var fh = this.__fh = {}, rc = this.__rc;
            fh[this.__alias] = rc ? rc.fact.object : null;
            return this;
        },

        addConstraint: function (constraint) {
            if (this.constraint.isDefault) {
                this.constraint = constraint;
                this.isDefault = false;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.__alias = this.constraint.get("alias");
            this.__varLength = (this.__variables = this.__variables.concat(this.constraint.get("variables"))).length;
            this.constraintAssert = this.constraint.assert;
        },

        equal: function (constraint) {
            if (this.isDefault !== true) {
                return this.constraint.equal(constraint.constraint);
            }
        },

        isMatch: function () {
            return this.isDefault || this.constraintAssert(this.__fh);
        },

        match: function () {
            var ret;
            if (this.isDefault) {
                ret = this.__lcMatch.merge(this.__rcMatch);
            } else {
                ret = {isMatch: false};
                var fh = this.__fh;
                if (this.constraintAssert(fh)) {
                    ret = this.__lcMatch.merge(this.__rcMatch);
                }
            }
            return ret;
        }

    }

}).as(module);