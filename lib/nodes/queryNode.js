var TerminalNode = require("./terminalNode"),
    extd = require("../extended"),
    bind = extd.bind;

TerminalNode.extend({
    instance: {

        __assertModify: function (context) {
            var match = context.match;
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
				rule.fire(this.agenda.flow, match);
            }
        },
        toString: function () {
            return "QueryNode " + this.rule.name;
        }
    }
}).as(module);