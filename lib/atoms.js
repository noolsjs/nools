var comb = require("comb"), constraintMatcher;

var Atom = comb.define(null, {

    instance:{
        constructor:function (type, constraint) {
            !constraintMatcher && (constraintMatcher = require("./constraintMatcher"));
            this.type = type;
            this.constraint = constraint;
        },
        assert:function () {
            throw "not implemented";
        },

        shareable:function (atom) {
            return comb.isInstanceOf(atom, this._static) && this.alias == atom.alias && constraintMatcher.equal(this.constraint, atom.constraint);
        },

        getters:{
            variables:function () {
                return [this.alias];
            }
        }


    }
});

comb.define(Atom, {
    instance:{
        constructor:function (type) {
            this._super(["object", type]);
        },

        assert:function (param) {
            return param instanceof this.constraint || param.constructor === this.constraint;
        },

        shareable:function (atom) {
            return comb.isInstanceOf(atom, this._static) && this.constraint === atom.constraint;
        }
    }
}).as(exports, "ObjectAtom");

comb.define(Atom, {

    instance:{
        constructor:function (constraint) {
            this._super(["equality", constraint]);
        },

        assert:function (hash) {
            return constraintMatcher.match(hash, this.constraint);
        }
    }
}).as(exports, "EqualityAtom");

comb.define(Atom, {

    instance:{
        constructor:function (constraint) {
            this._super(["equality", [true]]);
        },

        shareable : function(atom){
            return comb.isInstanceOf(atom, this._static) && this.alias == atom.alias;
        },


        assert:function (assertable) {
            return true;
        }
    }
}).as(exports, "TrueAtom");

comb.define(Atom, {

    instance:{
        constructor:function (constraint) {
            this._super(["reference", constraint]);
        },

        assert:function (values) {
            return constraintMatcher.match(values, this.constraint);
        },

        getters:{
            variables:function () {
                return this.vars;
            },

            alias:function () {
                return this._alias;
            }
        },

        setters:{
            alias:function (alias) {
                this._alias = alias;
                this.vars = constraintMatcher.getIdentifiers(this.constraint).filter(function (v) {
                    return v != alias;
                }, this);
            }
        }
    }

}).as(exports, "ReferenceAtom");


comb.define(Atom, {
    instance:{
        constructor:function (hash) {
            this._super(["hash", hash]);
        },

        shareable : function(atom){
            return comb.isInstanceOf(atom, this._static) && this.alias == atom.alias && JSON.stringify(this.constraint) === JSON.stringify(atom.constraint);
        },

        assert:function (factHash) {
            var fact = factHash[this.alias];
            Object.keys(this.constraint).forEach(function (k) {
                var v = this.constraint[k];
                factHash[v] = fact[k];
            }, this);
            return true;
        },

        getters:{
            variables:function () {
                return this.constraint;
            }
        }

    }
}).as(exports, "HashAtom");

