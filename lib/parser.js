var Parser = require("jison").Parser, fs = require("fs");

var grammar = {
    "lex":{
        "rules":[
            ["\\s+", "/* skip whitespace */"],
            ["[0-9]+(?:\\.[0-9]+)?\\b", "return 'NUMBER';"],
            ["(eq|EQ)", "return '==';"],
            ["(neq|NEQ)", "return '!=';"],
            ["(lte|LTE)", "return '<=';"],
            ["(lt|LT)", "return '<';"],
            ["(gte|GTE)", "return '>=';"],
            ["(gt|GT)", "return '>';"],
            ["(like|LIKE)", "return '=~';"],
            ["(and|AND)", "return '&&';"],
            ["(or|OR)", "return '||';"],
            ["(true|false)", "return 'BOOLEAN';"],
            ["\'[a-zA-Z0-9]+\'", "return 'STRING';"],
            ["[a-zA-Z0-9]+", "return 'IDENTIFIER';"],
            ["\\/(.*)\\/", "return 'REGEXP';"],
            ["\\.", "return '.';"],
            ["\\*", "return '*';"],
            ["\\/", "return '/';"],
            ["-", "return '-';"],
            ["=~", "return '=~';"],
            ["==", "return '==';"],
            ["!=", "return '!=';"],
            ["<=", "return '<=';"],
            [">=", "return '>=';"],
            [">", "return '>';"],
            ["<", "return '<';"],
            ["&&", "return '&&';"],
            ["\\|\\|", "return '||';"],
            ["\\+", "return '+';"],
            ["\\^", "return '^';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
            ["PI\\b", "return 'PI';"],
            ["E\\b", "return 'E';"],
            ["$", "return 'EOF';"]
        ]
    },

    "operators":[
        ["left", "||", "&&"],
        ["left", "<", ">", "<=", ">="],
        ["left", "==", "!=", "=~"],
        ["left", "^"],
        ["left", "*", "/"],
        ["left", "+", "-"],
        ["left", "UMINUS"],
        ["left", "."]
    ],

    "bnf":{
        "expressions":[
            [ "e EOF", "return $1;"  ]
        ],

        "e":[
            [ "e && e", "$$ = [$1, $3, 'and'];" ],
            [ "e || e", "$$ = [$1, $3, 'or'];" ],
            [ "e . e", "$$ = [$1,$3, 'prop'];" ],
            [ "e + e", "$$ = [$1, $3, 'plus'];" ],
            [ "e - e", "$$ = [$1, $3, 'minus'];" ],
            [ "e * e", "$$ = [$1, $3, 'mult'];" ],
            [ "e / e", "$$ = [$1, $3, 'div'];" ],
            [ "e < e", "$$ = [$1, $3, 'lt'];" ],
            [ "e > e", "$$ = [$1, $3, 'gt'];" ],
            [ "e <= e", "$$ = [$1, $3, 'lte'];" ],
            [ "e >= e", "$$ = [$1, $3, 'gte'];" ],
            [ "e =~ e", "$$ = [$1, $3, 'like'];" ],
            [ "e == e", "$$ = [$1, $3, 'eq'];" ],
            [ "e != e", "$$ = [$1, $3, 'neq'];" ],
            [ "e ^ e", "$$ = [$1, $3, 'pow'];" ],
            [ "- e", "$$ = [$2, null, 'unminus'];"],
            [ "( e )", "$$ = ($2);" ],
            [ "STRING", "$$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];" ],
            [ "NUMBER", "$$ = [Number(yytext), null, 'number'];"],
            [ "REGEXP", "$$ = [RegExp(yytext.replace(/^\\/|\\/$/g, '')), null, 'regexp'];" ],
            [ "BOOLEAN", "$$ = [yytext == 'true', null, 'boolean'];" ],
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ]
        ]
    }
};

var parser = new Parser(grammar);


// generate source, ready to be written to disk
//var parserSource = parser.generate();

exports.parse = function (expression) {
    try {
        return parser.parse(expression);
    } catch (e) {
        throw new Error("Invalid expression '" + expression + "'");
    }
};
