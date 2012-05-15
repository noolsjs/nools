var comb = require("comb"),
    Node = require("./node"),
    define = comb.define,
    removeDuplicates = comb.array.removeDuplicates;

define(Node, {
    instance:{
        constructor:function (bucket, rule, agenda) {
            this._super([]);
            this.rule = rule;
            this.name = this.rule.name;
            this.agenda = agenda;
            this.bucket = bucket;
            agenda.register(this);
        },

        __assertModify:function (context) {
            var match = context.match;
            match.recency.sort(
                function (a, b) {
                    return a - b;
                }).reverse();
            match.facts = removeDuplicates(match.facts);
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
                this.agenda.insert(this, {
                    rule:rule,
                    name:rule.name,
                    recency:bucket.recency++,
                    match:match,
                    counter:bucket.counter
                });
            }
        },

        assert:function (context) {
            this.__assertModify(context);
        },

        modify:function (context) {
            this.__assertModify(context);
        },

        retract:function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractResolve:function (match) {
            var resolve = this.resolve.bind(this);
            this.agenda.retract(this, function (v) {
                return resolve(v.match, match);
            });
        },

        toString:function () {
            return "Terminal Node " + this.rule.name;
        }
    }
}).as(module);