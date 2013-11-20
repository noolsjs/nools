var Node = require("./node"),
    extd = require("../extended"),
    bind = extd.bind;

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
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
                this.agenda.insert(this, {
                    rule: rule,
                    hashCode: context.hashCode,
                    index: this.index,
                    name: rule.name,
                    recency: bucket.recency++,
                    match: match,
                    counter: bucket.counter
                });
            }
        },

        assert: function (context) {
            this.__assertModify(context);
        },

        modify: function (context) {
            this.agenda.retract(this, context);
            this.__assertModify(context);
        },

        retract: function (context) {
            this.agenda.retract(this, context);
        },

        retractRight: function (context) {
            this.agenda.retract(this, context);
        },

        retractLeft: function (context) {
            this.agenda.retract(this, context);
        },

        assertLeft: function (context) {
            this.__assertModify(context);
        },

        assertRight: function (context) {
            this.__assertModify(context);
        },

        toString: function () {
            return "TerminalNode " + this.rule.name;
        }
    }
}).as(module);