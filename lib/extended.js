module.exports = require("extended")
    .register(require("is-extended"))
    .register("array", require("array-extended"))
    .register("date", require("date-extended"))
    .register("object", require("object-extended"))
    .register("string", require("string-extended"));


