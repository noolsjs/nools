(function (win) {
    "use strict";

    win.require = {

        baseUrl: './scripts',

        packages: [
            { name: 'banking' }
        ],

        paths: {
            // folders
            jquery: "empty:", // !important - build will fail without this

            // libraries
            backboneLocalStorage: './backbone-localstorage',
            underscore: './underscore',
            backbone: './backbone',

            // Require.js plugins
            text: './text'
        },

        // these libs are not written for AMD. Make them behave like they are
        shim: {
            underscore: {
                deps: ['jquery'],
                exports: '_',
                init: function () {
                    _.templateSettings = {
                        interpolate: /\{\{(.+?)\}\}/g
                    };
                    return _.noConflict();
                }
            },
            backbone: {
                deps: ['underscore', 'jquery'],
                exports: 'Backbone',
                init: function (_, $) {
                    return Backbone.noConflict();
                }
            },
            backboneLocalStorage: {
                deps: ["backbone"]
            }
        }
    };
}).call(this, this);
