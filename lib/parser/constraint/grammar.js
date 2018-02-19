var Parser = require("jison").Parser, fs = require("fs");

var grammar = {
    "lex": {
        "rules": [
            ["\\s+in\\b", "return 'in';"],
            ["\\s+notIn\\b", "return 'notIn';"],
            ["\\s+from\\b", "return 'from';"],
            ["\\s+(eq|EQ)\\b", "return '==';"],
            ["\\s+(seq|SEQ)\\b", "return '===';"],
            ["\\s+(neq|NEQ)\\b", "return '!=';"],
            ["\\s+(sneq|SNEQ)\\b", "return '!==';"],
            ["\\s+(lte|LTE)\\b", "return '<=';"],
            ["\\s+(lt|LT)\\b", "return '<';"],
            ["\\s+(gte|GTE)\\b", "return '>=';"],
            ["\\s+(gt|GT)\\b", "return '>';"],
            ["\\s+(like|LIKE)\\b", "return '=~';"],
            ["\\s+(notLike|NOT_LIKE)\\b", "return '!=~';"],
            ["\\s+(and|AND)\\b", "return '&&';"],
            ["\\s+(or|OR)\\b", "return '||';"],
            ["\\s*(null)\\b", "return 'NULL';"],
            ["\\s*(true|false)\\b", "return 'BOOLEAN';"],
            ["\\s+", "/* skip whitespace */"],
            ["-?[0-9]+(?:\\.[0-9]+)?\\b", "return 'NUMBER';"],
            ["\'[^\']*\'", "return 'STRING';"],
            ['\"[^\"]*\"', "return 'STRING';"],
            ["([a-zA-Z_$][0-9a-zA-Z_$]*)", "return 'IDENTIFIER';"],
            ["^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)", "return 'REGEXP';"],
            ["\\.", "return '.';"],
            ["\\*", "return '*';"],
            ["\\/", "return '/';"],
            ["\\%", "return '%';"],
            [",", "return ',';"],
            ["=~", "return '=~';"],
            ["!=~", "return '!=~';"],
            ["===", "return '===';"],
            ["==", "return '==';"],
            ["!==", "return '!==';"],
            ["!=", "return '!=';"],
            ["<=", "return '<=';"],
            [">=", "return '>=';"],
            [">", "return '>';"],
            ["<", "return '<';"],
            ["&&", "return '&&';"],
            ["\\|\\|", "return '||';"],
            ["\\+", "return '+';"],
            ["-", "return '-';"],
            ["\\^", "return '^';"],
            ["\\(", "return '(';"],
            ["\\]", "return ']';"],
            ["\\[", "return '[';"],
            ["\\)", "return ')';"],
            ["!", "return '!';"],
            ["$", "return 'EOF';"]
        ]
    },

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
    "operators": [
        ["left", ","],
        ["left", "||"],
        ["left", "&&"],
        ["left", "==", "!=", "===", "!==", "=~", "!=~"],
        ["left", "<", "<=", ">", ">="],
        ["left", "+", "-"],
        ["left", "^", "*", "/", "%"],
        ["left", "UNARY", "!"],
        ["left", "("],
        ["left", "in", "notIn"],
        ["left", ".", "["],
        ["left", "COMPOSITE"]
    ],

    "bnf": {
        "expressions": [
            [ "EXPR EOF", "return $1;"  ]
        ],

        "EXPR": [
            "LITERAL",
            "ARRAY",
            "IN",
            "ARG_LIST",
            "PROP",
            "FUNCTION",
            "MATH",
            "COMPARE",
            "COMPOSITE",
            "LOGICAL"
        ],

        "LITERAL": [
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ],
            [ "NUMBER", "$$ = [Number(yytext), null, 'number'];"],
            [ "REGEXP", "$$ = [yytext, null, 'regexp'];" ],
            [ "BOOLEAN", "$$ = [yytext.replace(/^\\s+/, '') == 'true', null, 'boolean'];" ],
            [ "NULL", "$$ = [null, null, 'null'];" ],
            [ "STRING", "$$ = [String(yytext.replace(/^['|\"]|['|\"]$/g, '')), null, 'string'];" ]
        ],

        "ARRAY": [
            [ "[ ]", "$$ = [null, null, 'array'];" ],
            [ "[ EXPR ]", "$$ = [$2, null, 'array'];" ]
        ],

        "IN": [
            [ "EXPR in [ ]", "$$ = [$1, [null, null, 'array'], 'in'];" ],
            [ "EXPR notIn [ ]", "$$ = [$1, [null, null, 'array'], 'notIn'];" ],
            [ "EXPR in [ EXPR ]", "$$ = [$1, [$4, null, 'array'], 'in'];" ],
            [ "EXPR notIn [ EXPR ]", "$$ = [$1, [$4, null, 'array'], 'notIn'];" ]
        ],

        "ARG_LIST": [
            ["EXPR , EXPR", "$$ = [$1, $3, 'arguments']"]
        ],

        "PROP": [
            [ "EXPR . EXPR", "$$ = [$1, $3, 'prop'];" ],
            [ "EXPR [ EXPR ]", "$$ = [$1, $3, 'propLookup'];"]
        ],

        "FUNCTION": [
            [ "EXPR ( )", "$$ = [$1, [null, null, 'arguments'], 'function']"],
            [ "EXPR ( EXPR )", "$$ = [$1, $3, 'function']"]
        ],

        "MATH": [
            [ "EXPR * EXPR", "$$ = [$1, $3, 'mult'];" ],
            [ "EXPR / EXPR", "$$ = [$1, $3, 'div'];" ],
            [ "EXPR % EXPR", "$$ = [$1, $3, 'mod'];" ],
            [ "EXPR + EXPR", "$$ = [$1, $3, 'plus'];" ],
            [ "EXPR - EXPR", "$$ = [$1, $3, 'minus'];" ],
            [ "- EXPR", "$$ = [$2, null, 'unary'];", {"prec": "UNARY"}],
            [ "EXPR ^ EXPR", "$$ = [$1, $3, 'pow']"]
        ],

        "COMPARE": [
            [ "EXPR < EXPR", "$$ = [$1, $3, 'lt'];" ],
            [ "EXPR > EXPR", "$$ = [$1, $3, 'gt'];" ],
            [ "EXPR <= EXPR", "$$ = [$1, $3, 'lte'];" ],
            [ "EXPR >= EXPR", "$$ = [$1, $3, 'gte'];" ],
            [ "EXPR == EXPR", "$$ = [$1, $3, 'eq'];" ],
            [ "EXPR === EXPR", "$$ = [$1, $3, 'seq'];" ],
            [ "EXPR != EXPR", "$$ = [$1, $3, 'neq'];" ],
            [ "EXPR !== EXPR", "$$ = [$1, $3, 'sneq'];" ],
            [ "EXPR =~ EXPR", "$$ = [$1, $3, 'like'];" ],
            [ "EXPR !=~ EXPR", "$$ = [$1, $3, 'notLike'];" ]
        ],

        "COMPOSITE": [
            [ "( EXPR )", "$$ = [$2, null, 'composite']" , {"prec": "COMPOSITE"}]
        ],

        "LOGICAL": [
            [ "EXPR && EXPR", "$$ = [$1, $3, 'and'];" ],
            [ "EXPR || EXPR", "$$ = [$1, $3, 'or'];" ],
            [ "! EXPR", "$$ = [$2, null, 'logicalNot'];"]
        ]
    }
};

var parser = new Parser(grammar);
fs.writeFileSync(__dirname + '/parser.js', parser.generate());
