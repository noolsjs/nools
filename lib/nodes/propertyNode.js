var AlphaNode = require("./alphaNode"),
    Context = require("../context"),
    extd = require("../extended");

AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
            this.varLength = (this.variables = extd(this.constraint.get("variables")).toArray().value()).length;
        },

        assert: function (context) {
            var c = new Context(context.fact, context.paths);
            var variables = this.variables, o = context.fact.object, item;
            c.set(this.alias, o);
            for (var i = 0, l = this.varLength; i < l; i++) {
                item = variables[i];
                c.set(item[1], o[item[0]]);
            }

            this.__propagate("assert", c);

        },

        retract: function (context) {
            this.__propagate("retract", new Context(context.fact, context.paths));
        },

        modify: function (context) {
            var c = new Context(context.fact, context.paths);
            var variables = this.variables, o = context.fact.object, item;
            c.set(this.alias, o);
            for (var i = 0, l = this.varLength; i < l; i++) {
                item = variables[i];
                c.set(item[1], o[item[0]]);
            }
            this.__propagate("modify", c);
        },


        toString: function () {
            return "PropertyNode" + this.__count;
        }
    }
}).as(module);


