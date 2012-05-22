(function () {
    "use strict";


    var WHITE_SPACE_REG = /[\s|\n|\r|\t]/;

    var TOKEN_INVERTS = {
        "{":"}",
        "}":"{",
        "(":")",
        ")":"(",
        "[":"]"
    };

    var getTokensBetween = exports.getTokensBetween = function (str, start, stop, includeStartEnd) {
        var depth = 0, ret = [];
        if (!start) {
            start = TOKEN_INVERTS[stop];
            depth = 1;
        }
        if (!stop) {
            stop = TOKEN_INVERTS[start];
        }
        var startPushing = false, token, cursor = 0, found = false;
        while ((token = str[cursor])) {
            if (token === start) {
                depth++;
                if (!startPushing) {
                    startPushing = true;
                    if (includeStartEnd) {
                        ret.push(token);
                    }
                } else {
                    ret.push(token);
                }
            } else if (token === stop && cursor) {
                depth--;
                if (depth === 0) {
                    if (includeStartEnd) {
                        ret.push(token);
                    }
                    found = true;
                    break;
                }
                ret.push(token);
            } else if (startPushing) {
                ret.push(token);
            }
            cursor++;
        }
        if(!found){
            throw new Error("Unable to match " + start + " in " + str);
        }
        return ret;
    };

    exports.getParamList = function (str) {
        return  getTokensBetween(str, "(", ")", true).join("");
    };

    var findNextTokenIndex = exports.findNextTokenIndex = function (str, startIndex, endIndex) {
        startIndex = startIndex || 0;
        endIndex = endIndex || str.length;
        var ret = -1, l = str.length;
        if (!endIndex || endIndex > l) {
            endIndex = l;
        }
        for (; startIndex < endIndex; startIndex++) {
            var c = str[startIndex];
            if (!WHITE_SPACE_REG.test(c)) {
                ret = startIndex;
                break;
            }
        }
        return ret;
    };

    var findNextToken = exports.findNextToken = function(str, startIndex, endIndex){
       return str.charAt(findNextTokenIndex(str, startIndex, endIndex));
    };


})();