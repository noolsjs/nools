var comb = require("comb"),
    Node = require("./node"),
    define = comb.define;

define(Node, {
    instance:{

        retractResolve:function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose:function (context) {
            this.propagateDispose(context);
        },

        propagateAssert:function (context) {
            this.__propagate("assertRight", context);
        },

        propagateRetract:function (context) {
            this.__propagate("retractRight", context);
        },

        propagateResolve:function (context) {
            this.__propagate("retractResolve", context);
        },

        modify:function (context) {
            this.__propagate("modifyRight", context);
        }
    }
}).as(module);