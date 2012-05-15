var LeftAdapterNode = define(Node, {
    instance:{
        propagateAssert:function (context) {
            this.__propagate("assertLeft", context);
        },

        propagateRetract:function (context) {
            this.__propagate("retractLeft", context);
        },

        propagateResolve:function (context) {
            this.__propagate("retractResolve", context);
        },

        modify:function (context) {
            this.__propagate("modifyLeft", context);
        },

        retractResolve:function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose:function (context) {
            this.propagateDispose(context);
        }
    }

});