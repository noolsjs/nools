(function () {
    function _getCompiled(nools) {
        return nools.compile({"define": [
            {"name": "Count", "properties": "({\n constructor: function(){\n this.called = 0;\n }\n})"}
        ], "rules": [
            {"name": "hello", "options": {}, "constraints": [
                ["not", "String", "s", "s == 'hello'"],
                ["Count", "count"]
            ], "action": "count.called++;\n "}
        ], "scope": []}, {name: "notRule-compiled"});
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            return _getCompiled(require("../../"));
        }
    } else if ("function" === typeof define && define.amd) {
        define(["nools"], function (nools) {
            return _getCompiled(nools);
        });
    } else {
        _getCompiled(this.nools);
    }
}).call(this);
