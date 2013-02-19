var Node = require("./node");

Node.extend({

    instance: {

        constructor: function () {
            this._super(arguments);
            this.__fh = {};
            this.__lc = this.__rc = this.__hc = null;
        },

        setLeftContext: function (lc) {
            this.__lc = lc;
            var match = lc.match;
            var newFh = match.factHash, fh = this.__fh;
            for (var i in newFh) {
                fh[i] = newFh[i];
            }
            return this;
        },

        setRightContext: function (rc) {
            this.__fh[this.__alias] = (this.__rc = rc).fact.object;
            return this;
        },

        clearContexts: function () {
            this.__fh = {};
            this.__lc = null;
            this.__rc = null;
            this.__hc = "";
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
            if (!this.constraint) {
                this.constraint = constraint;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        equal: function (constraint) {
            if (this.constraint) {
                return this.constraint.equal(constraint.constraint);
            }
        },

        isMatch: function () {
            var constraint = this.constraint;
            if (constraint) {
                return constraint.assert(this.__fh);
            }
            return true;
        },

        match: function () {
            var ret = {isMatch: false}, constraint = this.constraint;
            if (!constraint) {
                ret = this.__lc.match.merge(this.__rc.match);
            } else {
                var rightContext = this.__rc, fh = this.__fh;
                if (constraint.assert(fh)) {
                    ret = this.__lc.match.merge(rightContext.match);
                }
            }
            return ret;
        }

    }

}).as(module);