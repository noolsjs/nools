(function () {
    function _getCompiled(nools) {
        return nools.compile({"define": [
            {"name": "Patient", "properties": "({\n name : null,\n fever : null,\n spots : null,\n rash : null,\n soreThroat : null,\n innoculated : null\n})"},
            {"name": "Diagnosis", "properties": "({\n name : null,\n diagnosis : null\n})"},
            {"name": "Treatment", "properties": "({\n name : null,\n treatment : null\n})"}
        ], "rules": [
            {"name": "Measels", "options": {}, "constraints": [
                ["Patient", "p", "p.fever == 'high' && p.spots == true && p.innoculated == true", {"name": "n"}],
                ["not", "Diagnosis", "d", "d.name == n && d.diagnosis == 'allergy'"]
            ], "action": "assert(new Diagnosis({name : n, diagnosis : \"measles\"}));\n "},
            {"name": "Allergy1", "options": {}, "constraints": [
                ["Patient", "p", "p.spots == true", {"name": "n"}],
                ["not", "Diagnosis", "d", "d.name == n && d.diagnosis == 'measles'"]
            ], "action": "assert(new Diagnosis({name : n, diagnosis : \"allergy\"}));\n "},
            {"name": "Allergy2", "options": {}, "constraints": [
                ["Patient", "p", "p.rash == true", {"name": "n"}]
            ], "action": "assert(new Diagnosis({name : n, diagnosis : \"allergy\"}));\n "},
            {"name": "Flu", "options": {}, "constraints": [
                ["Patient", "p", "p.soreThroat == true && p.fever in ['mild', 'high']", {"name": "n"}]
            ], "action": "assert(new Diagnosis({name : n, diagnosis : \"flu\"}));\n "},
            {"name": "Penicillin", "options": {}, "constraints": [
                ["Diagnosis", "d", "d.diagnosis == 'measles'", {"name": "n"}]
            ], "action": "assert(new Treatment({name : n, treatment : \"penicillin\"}));\n "},
            {"name": "AllergyPills", "options": {}, "constraints": [
                ["Diagnosis", "d", "d.diagnosis == 'allergy'", {"name": "n"}]
            ], "action": "assert(new Treatment({name : n, treatment : \"allergyShot\"}));\n "},
            {"name": "BedRest", "options": {}, "constraints": [
                ["Diagnosis", "d", "d.diagnosis == 'flu'", {"name": "n"}]
            ], "action": "assert(new Treatment({name : n, treatment : \"bedRest\"}));\n "},
            {"name": "Collect", "options": {}, "constraints": [
                ["Treatment", "t"],
                ["Array", "r"]
            ], "action": "r.push(t);\n "}
        ], "scope": []}, {name: "diagnosis-compiled"});
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
