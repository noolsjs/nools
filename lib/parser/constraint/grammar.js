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
            ["-", "return '-';"],
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
            ["\\^", "return '^';"],
            ["\\(", "return '(';"],
            ["\\]", "return ']';"],
            ["\\[", "return '[';"],
            ["\\)", "return ')';"],
            ["!", "return '!';"],
            ["$", "return 'EOF';"]
        ]
    },

    "bnf": {
        "expressions": [
            [ "EXPRESSION EOF", "return $1;"  ]
        ],

        "UNARY_EXPRESSION": [
            "LITERAL_EXPRESSION",
            [ "- UNARY_EXPRESSION", "$$ = [$2, null, 'unary'];"],
            [ "! UNARY_EXPRESSION", "$$ = [$2, null, 'logicalNot'];"]
        ],

        "MULTIPLICATIVE_EXPRESSION": [
            "UNARY_EXPRESSION",
            [ "MULTIPLICATIVE_EXPRESSION * UNARY_EXPRESSION", "$$ = [$1, $3, 'mult'];" ],
            [ "MULTIPLICATIVE_EXPRESSION / UNARY_EXPRESSION", "$$ = [$1, $3, 'div'];" ],
            [ "MULTIPLICATIVE_EXPRESSION % UNARY_EXPRESSION", "$$ = [$1, $3, 'mod'];" ]
        ],

        "ADDITIVE_EXPRESSION": [
            "MULTIPLICATIVE_EXPRESSION",
            [ "ADDITIVE_EXPRESSION + MULTIPLICATIVE_EXPRESSION", "$$ = [$1, $3, 'plus'];" ],
            [ "ADDITIVE_EXPRESSION - MULTIPLICATIVE_EXPRESSION", "$$ = [$1, $3, 'minus'];" ]
        ],

        "EXPONENT_EXPRESSION": [
            "ADDITIVE_EXPRESSION",
            [ "EXPONENT_EXPRESSION ^ ADDITIVE_EXPRESSION", "$$ = [$1, $3, 'pow'];" ]
        ],

        "RELATIONAL_EXPRESSION": [
            "EXPONENT_EXPRESSION",
            [ "RELATIONAL_EXPRESSION < EXPONENT_EXPRESSION", "$$ = [$1, $3, 'lt'];" ],
            [ "RELATIONAL_EXPRESSION > EXPONENT_EXPRESSION", "$$ = [$1, $3, 'gt'];" ],
            [ "RELATIONAL_EXPRESSION <= EXPONENT_EXPRESSION", "$$ = [$1, $3, 'lte'];" ],
            [ "RELATIONAL_EXPRESSION >= EXPONENT_EXPRESSION", "$$ = [$1, $3, 'gte'];" ]
        ],

        "EQUALITY_EXPRESSION": [
            "RELATIONAL_EXPRESSION",
            [ "EQUALITY_EXPRESSION == RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'eq'];" ],
            [ "EQUALITY_EXPRESSION === RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'seq'];" ],
            [ "EQUALITY_EXPRESSION != RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'neq'];" ],
            [ "EQUALITY_EXPRESSION !== RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'sneq'];" ],
            [ "EQUALITY_EXPRESSION =~ RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'like'];" ],
            [ "EQUALITY_EXPRESSION !=~ RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'notLike'];" ]
        ],

        "IN_EXPRESSION": [
            "EQUALITY_EXPRESSION",
            [ "LITERAL_EXPRESSION in ARRAY_EXPRESSION", "$$ = [$1, $3, 'in'];" ],
            [ "LITERAL_EXPRESSION notIn ARRAY_EXPRESSION", "$$ = [$1, $3, 'notIn'];" ],
            [ "LITERAL_EXPRESSION in OBJECT_EXPRESSION", "$$ = [$1, $3, 'in'];" ],
            [ "LITERAL_EXPRESSION notIn OBJECT_EXPRESSION", "$$ = [$1, $3, 'notIn'];" ]
        ],

        "AND_EXPRESSION": [
            "IN_EXPRESSION",
            [ "AND_EXPRESSION && IN_EXPRESSION", "$$ = [$1, $3, 'and'];" ]
        ],

        "OR_EXPRESSION": [
            "AND_EXPRESSION",
            [ "OR_EXPRESSION || AND_EXPRESSION", "$$ = [$1, $3, 'or'];" ]
        ],

        "ARGUMENT_LIST": [
            "LITERAL_EXPRESSION",
            ["ARGUMENT_LIST , LITERAL_EXPRESSION", "$$ = [$1, $3, 'arguments']"]
        ],

        "IDENTIFIER_EXPRESSION": [
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ]
        ],

        "OBJECT_EXPRESSION": [
            "IDENTIFIER_EXPRESSION",
            [ "OBJECT_EXPRESSION . IDENTIFIER_EXPRESSION", "$$ = [$1,$3, 'prop'];" ],
            [ "OBJECT_EXPRESSION [ STRING_EXPRESSION ]", "$$ = [$1,$3, 'propLookup'];" ],
            [ "OBJECT_EXPRESSION [ NUMBER_EXPRESSION ]", "$$ = [$1,$3, 'propLookup'];" ],
            [ "OBJECT_EXPRESSION [ OBJECT_EXPRESSION ]", "$$ = [$1,$3, 'propLookup'];" ],
            [ "OBJECT_EXPRESSION ( )", "$$ = [$1, [null, null, 'arguments'], 'function']"],
            [ "OBJECT_EXPRESSION ( ARGUMENT_LIST )", "$$ = [$1, $3, 'function']"]
        ],

        "STRING_EXPRESSION": [
            [ "STRING", "$$ = [String(yytext.replace(/^['|\"]|['|\"]$/g, '')), null, 'string'];" ]
        ],

        "NUMBER_EXPRESSION": [
            [ "NUMBER", "$$ = [Number(yytext), null, 'number'];"]
        ],

        "REGEXP_EXPRESSION": [
            [ "REGEXP", "$$ = [yytext, null, 'regexp'];" ]
        ],

        "BOOLEAN_EXPRESSION": [
            [ "BOOLEAN", "$$ = [yytext.replace(/^\\s+/, '') == 'true', null, 'boolean'];" ]
        ],

        "NULL_EXPRESSION": [
            [ "NULL", "$$ = [null, null, 'null'];" ]
        ],

        "ARRAY_EXPRESSION": [
            [ "[ ]", "$$ = [null, null, 'array'];" ],
            [ "[ ARGUMENT_LIST ]", "$$ = [$2, null, 'array'];" ]
        ],


        "LITERAL_EXPRESSION": [
            "STRING_EXPRESSION",
            "NUMBER_EXPRESSION",
            "REGEXP_EXPRESSION",
            "BOOLEAN_EXPRESSION",
            "NULL_EXPRESSION",
            "OBJECT_EXPRESSION",
            "ARRAY_EXPRESSION",
            [ "( EXPRESSION )", "$$ = [$2, null, 'composite']" ]
        ],

        "EXPRESSION": [
            "OR_EXPRESSION"
        ]
    }
};

var parser = new Parser(grammar);
fs.writeFileSync(__dirname + '/parser.js', parser.generate());
