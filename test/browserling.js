var it = require("it");

it.reporter("tap");

require("./constraintMatcher.test");
require("./flow.test");
require("./flow.compiled.test");
require("./noolsParser.test");
require("./parser.test");
require("./rules.test");

it.run();