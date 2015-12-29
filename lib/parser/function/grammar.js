var Parser = require("jison").Parser, fs = require("fs");

var grammar = {
    "lex": {
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["([a-zA-Z_$][0-9a-zA-Z_$]*)", "return 'IDENTIFIER';"],
         //   ["^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)", "return 'REGEXP';"],
            [",", "return ',';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
			[":", "return ':';"],
            ["$", "return 'EOF';"]
        ]
    },

    "bnf": {
        "expressions": [
            [ "OBJECT_EXPRESSION EOF", "return $1;"  ]
        ],

		 "DECL_LIST": [
            "ARG_DECL",
            ["DECL_LIST , ARG_DECL", "$$ = [$1, $3, 'arguments']"]
        ],

		"ARG_DECL" : [
			["IDENTIFIER_EXPRESSION : IDENTIFIER_EXPRESSION", "$$ = [$1, $3, 'arg-decl']"]
		],

        "IDENTIFIER_EXPRESSION": [
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ]
        ],

        "OBJECT_EXPRESSION": [
			"IDENTIFIER_EXPRESSION",
			[ "OBJECT_EXPRESSION ( DECL_LIST )", "$$ = [$1, $3, 'function']"],
			[ "OBJECT_EXPRESSION (  )", "$$ = [$1, [null, null, 'arguments'], 'function']"]
        ]
    }
};

var parser = new Parser(grammar);
fs.writeFileSync(__dirname + '/parser.js', parser.generate());
