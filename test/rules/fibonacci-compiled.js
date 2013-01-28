(function () {
    function _getCompiled(nools) {
        return nools.compile({"define": [
            {"name": "Fibonacci", "properties": "({\n sequence : null,\n value : -1,\n constructor : function(sequence, value){\n this.sequence = sequence;\n this.value = value || -1;\n }\n})"},
            {"name": "Result", "properties": "({\n value : 0,\n constructor : function(value){\n this.value = value;\n }\n\n})"}
        ], "rules": [
            {"name": "Recurse", "options": {"priority": 1}, "constraints": [
                ["Fibonacci", "f", "f.value == -1 && f.sequence != 1"]
            ], "action": "assert(new Fibonacci(f.sequence - 1));\n "},
            {"name": "Boostrap", "options": {}, "constraints": [
                ["Fibonacci", "f", "f.value == -1 && (f.sequence == 1 || f.sequence == 2)"]
            ], "action": "modify(f, function(){\n this.value = 1;\n });\n "},
            {"name": "Calculate", "options": {}, "constraints": [
                ["Fibonacci", "f1", "f1.value != -1", {"sequence": "s1"}],
                ["Fibonacci", "f2", "f2.value != -1 && f2.sequence == s1 + 1", {"sequence": "s2"}],
                ["Fibonacci", "f3", "f3.value == -1 && f3.sequence == s2 + 1"],
                ["Result", "r"]
            ], "action": "var v = f1.value + f2.value;\n modify(f3, function(){\n this.value = r.value = v;\n });\n retract(f1);\n "}
        ], "scope": []}, {name: "fibonacci-compiled"});
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
