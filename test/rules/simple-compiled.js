(function () {
    function _getCompiled(nools) {
        return nools.compile({"define": [
            {"name": "Message", "properties": "({\n message : \"\",\n constructor : function (message) {\n this.message = message;\n }\n})"}
        ], "rules": [
            {"name": "Hello", "options": {}, "constraints": [
                ["Message", "m", "m.message =~ /^hello(\\\\s*world)?$/"]
            ], "action": "modify(m, function(){\n this.message += \" goodbye\";\n })\n "},
            {"name": "Goodbye", "options": {}, "constraints": [
                ["Message", "m", "m.message =~ /.*goodbye$/"]
            ], "action": ""}
        ], "scope": []}, {name: "simple-compiled"});
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
