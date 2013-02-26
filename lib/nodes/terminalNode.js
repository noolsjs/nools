var Node = require("./node"),
    extd = require("../extended"),
    sum = extd.sum,
    bind = extd.bind,
    removeDuplicates = extd.removeDuplicates;

Node.extend({
    instance: {
        constructor: function (bucket, index, rule, agenda) {
            this._super([]);
            this.resolve = bind(this, this.resolve);
            this.rule = rule;
            this.index = index;
            this.name = this.rule.name;
            this.agenda = agenda;
            this.bucket = bucket;
            agenda.register(this);
        },

        __assertModify: function (context) {
            var match = context.match;
            match.recency.sort(
                function (a, b) {
                    return a - b;
                }).reverse();
            match.facts = removeDuplicates(match.facts);
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
                this.agenda.insert(this, {
                    rule: rule,
                    index: this.index,
                    name: rule.name,
                    recency: sum(match.recency),
                    match: match,
                    counter: bucket.counter
                });
            }
        },

        assert: function (context) {
            this.__assertModify(context);
        },

        modify: function (context) {
            this.__assertModify(context);
        },

        retract: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractRight: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractLeft: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        assertLeft: function (context) {
            this.__assertModify(context);
        },

        assertRight: function (context) {
            this.__assertModify(context);
        },

        retractResolve: function (match) {
            var resolve = this.resolve;
            this.agenda.retract(this, function (v) {
                return resolve(v.match, match);
            });
        },

        toString: function () {
            return "TerminalNode " + this.rule.name;
        }
    }
}).as(module);