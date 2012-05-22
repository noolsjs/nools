(function () {
    "use strict";

    var fs = require("fs"), path = require("path");

    var FILE_REG = /(.*)\.dat$/, files = {};
    fs.readdirSync(__dirname).filter(function (file) {
        return FILE_REG.test(file);
    }).forEach(function (f) {
            var name = f.match(FILE_REG)[1];
            files[name] = fs.readFileSync(path.resolve(__dirname, f), "utf8");
        });

    exports.load = function (flow) {
        var ret = {};
        Object.keys(files).forEach(function (name) {
            var data = files[name];
            var arr = ret[name] = [];
            data.split("\n").map(function (line) {
                return line.replace(/^\(|\)$/g, "");
            }).forEach(function (line) {
                    if (line) {
                        var parts = line.split(/\(/),
                            type = parts.shift();
                        var Cls = flow.getDefined(type.trim());
                        if (type) {
                            var args = {};
                            parts.forEach(function (p) {
                                var prop = p.trim().replace(/\)$/, "").split(/\s+/),
                                    name = prop[0].trim(),
                                    value = prop[1].trim();
                                args[name] = name == "seat" ? parseInt(value) : value;
                            });
                            arr.push(new Cls(args));
                        }
                    }
                });
        });
        return ret;
    };

})();