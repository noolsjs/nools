var Parser = require("jison").Parser, fs = require("fs");

var grammar = {
    "lex": {
        "rules": [
            ["\\s+in\\b", "return 'in';"],
            ["\\s+notIn\\b", "return 'notIn';"],
            ["\\s+", "/* skip whitespace */"],
            ["[0-9]+(?:\\.[0-9]+)?\\b", "return 'NUMBER';"],
            ["null\\b", "return 'NULL';"],
            ["(eq|EQ)", "return '==';"],
            ["(neq|NEQ)", "return '!=';"],
            ["(lte|LTE)", "return '<=';"],
            ["(lt|LT)", "return '<';"],
            ["(gte|GTE)", "return '>=';"],
            ["(gt|GT)", "return '>';"],
            ["(like|LIKE)", "return '=~';"],
            ["(notLike|NOT_LIKE)", "return '!=~';"],
            ["(and|AND)", "return '&&';"],
            ["(or|OR)", "return '||';"],
            ["(true|false)", "return 'BOOLEAN';"],
            ["\'[^\']*\'", "return 'STRING';"],
            ["[a-zA-Z0-9]+", "return 'IDENTIFIER';"],
            ["\\/(.*)\\/", "return 'REGEXP';"],
            ["\\.", "return '.';"],
            ["\\*", "return '*';"],
            ["\\/", "return '/';"],
            [",", "return ',';"],
            ["-", "return '-';"],
            ["=~", "return '=~';"],
            ["!=~", "return '!=~';"],
            ["==", "return '==';"],
            ["===", "return '==';"],
            ["!=", "return '!=';"],
            ["!==", "return '!=';"],
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
            ["$", "return 'EOF';"]
        ]
    },

    "bnf": {
        "expressions": [
            [ "EXPRESSION EOF", "return $1;"  ]
        ],

        "UNARY_EXPRESSION": [
            "LITERAL_EXPRESSION",
            [ "- UNARY_EXPRESSION", "$$ = [$2, null, 'unminus'];"]
        ],

        "MULTIPLICATIVE_EXPRESSION": [
            "UNARY_EXPRESSION",
            [ "MULTIPLICATIVE_EXPRESSION * UNARY_EXPRESSION", "$$ = [$1, $3, 'mult'];" ],
            [ "MULTIPLICATIVE_EXPRESSION / UNARY_EXPRESSION", "$$ = [$1, $3, 'div'];" ]
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
            [ "EQUALITY_EXPRESSION != RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'neq'];" ],
            [ "EQUALITY_EXPRESSION === RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'seq'];" ],
            [ "EQUALITY_EXPRESSION !== RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'sneq'];" ],
            [ "EQUALITY_EXPRESSION =~ RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'like'];" ],
            [ "EQUALITY_EXPRESSION !=~ RELATIONAL_EXPRESSION", "$$ = [$1, $3, 'notLike'];" ]
        ],

        "IN_EXPRESSION": [
            "EQUALITY_EXPRESSION",
            [ "LITERAL_EXPRESSION in ARRAY_EXPRESSION", "$$ = [$1, $3, 'in'];" ]
        ],

        "NOT_IN_EXPRESSION": [
            "IN_EXPRESSION",
            [ "LITERAL_EXPRESSION notIn ARRAY_EXPRESSION", "$$ = [$1, $3, 'notIn'];" ]
        ],

        "AND_EXPRESSION": [
            "NOT_IN_EXPRESSION",
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

        "FUNCTION": [
            ["IDENTIFIER ( )", "$$ = [$1, [null, null, 'arguments'], 'function']"],
            ["IDENTIFIER ( ARGUMENT_LIST )", "$$ = [$1, $3, 'function']"]
        ],

        "OBJECT_EXPRESSION": [
            "IDENTIFIER_EXPRESSION",
            [ "OBJECT_EXPRESSION . IDENTIFIER_EXPRESSION", "$$ = [$1,$3, 'prop'];" ],
            [ "OBJECT_EXPRESSION . FUNCTION", "$$ = [$1,$3, 'prop'];" ]
        ],

        "IDENTIFIER_EXPRESSION": [
            [ "IDENTIFIER", "$$ = [String(yytext), null, 'identifier'];" ]
        ],

        "STRING_EXPRESSION": [
            [ "STRING", "$$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];" ]
        ],

        "NUMBER_EXPRESSION": [
            [ "NUMBER", "$$ = [Number(yytext), null, 'number'];"]
        ],

        "REGEXP_EXPRESSION": [
            [ "REGEXP", "$$ = [RegExp(yytext.replace(/^\\/|\\/$/g, '')), null, 'regexp'];" ]
        ],

        "BOOLEAN_EXPRESSION": [
            [ "BOOLEAN", "$$ = [yytext == 'true', null, 'boolean'];" ]
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
            "FUNCTION",
            "ARRAY_EXPRESSION",
            "OBJECT_EXPRESSION",
            [ "( EXPRESSION )", "$$ = $2" ]
        ],

        "EXPRESSION": [
            "OR_EXPRESSION"
        ]
    }
};

var parser = new Parser(grammar);
fs.writeFileSync(__dirname + '/parser.js', parser.generate());
