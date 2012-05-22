(function () {
    "use strict";

    var fs = require("fs"),
        tokens = require("./tokens.js"),
        utils = require("./util.js");

    var parse = function (src, keywords, context) {
        var orig = src;
        src = src.replace(/\/\/(.*)\n/g, "");

        var blockTypes = new RegExp("^(" + Object.keys(keywords).join("|") + ")"), index;
        while (src && (index = utils.findNextTokenIndex(src)) !== -1) {
            src = src.substr(index);
            var blockType = src.match(blockTypes);
            if (blockType !== null) {
                blockType = blockType[1];
                if (blockType in keywords) {
                    try {
                        src = keywords[blockType](src, context, parse).trim();
                    } catch (e) {
                        throw new Error("Invalid " + blockType + " definition \n" + e.message + "; \nstarting at : " + orig);
                    }
                } else {
                    throw new Error("Unknown token" + blockType);
                }
            } else {
                throw new Error("Error parsing " + src);
            }
        }
    };

    exports.parse = function (src) {
        var context = {define:[], rules:[], scope : []};
        parse(src, tokens, context);
        return context;
    };

})();