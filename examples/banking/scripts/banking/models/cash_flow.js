define(["backbone"], function (Backbone) {

    return Backbone.Model.extend({
        defaults: {
            date: null,
            amount: 0,
            type: null
        },

        initialize: function (options) {
            if (options.account) {
                this.account = options.account;
                this.unset("account");
            }
        }
    });

});