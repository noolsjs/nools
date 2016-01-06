var Parser = require("jison").Parser, fs = require("fs");

var grammar = {
    "lex": {
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["([a-zA-Z_$][0-9a-zA-Z_$]*)", "return 'IDENTIFIER';"],
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
           ["ARG_DECL", "$$ = [$1, 'arguments']"],
            ["DECL_LIST , ARG_DECL", "$$ = [[$1[0][0],$1[0][1], 'arg-decl'], $3, 'arguments']"]
        ],

		"ARG_DECL" : [
			["IDENTIFIER_EXPRESSION ARG_IDENT", "$$ = [$1, $2, 'arg-decl']"]
		],

		"ARG_IDENT" : [
			["IDENTIFIER_EXPRESSION", "$$ = [$1, 'arg-ident']"]
		],

        "IDENTIFIER_EXPRESSION": [
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ]
        ],

        "OBJECT_EXPRESSION": [
			"IDENTIFIER_EXPRESSION",
			[ "OBJECT_EXPRESSION ( )", "$$ = [$1, ['arguments'], 'function']"],
			[ "OBJECT_EXPRESSION ( DECL_LIST )", "$$ = [$1, $3, 'function']"]
        ]
    }
};

var parser = new Parser(grammar);
fs.writeFileSync(__dirname + '/parser.js', parser.generate());
