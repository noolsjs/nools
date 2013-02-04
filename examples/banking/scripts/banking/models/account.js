define(["backbone"], function (Backbone) {

    return Backbone.Model.extend({
        defaults: {
            balance: 0,
            accountNo: null
        }
    });

});