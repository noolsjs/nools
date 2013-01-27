/* Jison generated parser */
var parser = (function () {
    var parser = {trace: function trace() {
    },
        yy: {},
        symbols_: {"error": 2, "expressions": 3, "EXPRESSION": 4, "EOF": 5, "UNARY_EXPRESSION": 6, "LITERAL_EXPRESSION": 7, "-": 8, "MULTIPLICATIVE_EXPRESSION": 9, "*": 10, "/": 11, "ADDITIVE_EXPRESSION": 12, "+": 13, "EXPONENT_EXPRESSION": 14, "^": 15, "RELATIONAL_EXPRESSION": 16, "<": 17, ">": 18, "<=": 19, ">=": 20, "EQUALITY_EXPRESSION": 21, "==": 22, "!=": 23, "=~": 24, "!=~": 25, "IN_EXPRESSION": 26, "in": 27, "ARRAY_EXPRESSION": 28, "notIn": 29, "AND_EXPRESSION": 30, "&&": 31, "OR_EXPRESSION": 32, "||": 33, "ARGUMENT_LIST": 34, ",": 35, "FUNCTION": 36, "IDENTIFIER": 37, "(": 38, ")": 39, "OBJECT_EXPRESSION": 40, "IDENTIFIER_EXPRESSION": 41, ".": 42, "STRING_EXPRESSION": 43, "STRING": 44, "NUMBER_EXPRESSION": 45, "NUMBER": 46, "REGEXP_EXPRESSION": 47, "REGEXP": 48, "BOOLEAN_EXPRESSION": 49, "BOOLEAN": 50, "NULL_EXPRESSION": 51, "NULL": 52, "[": 53, "]": 54, "$accept": 0, "$end": 1},
        terminals_: {2: "error", 5: "EOF", 8: "-", 10: "*", 11: "/", 13: "+", 15: "^", 17: "<", 18: ">", 19: "<=", 20: ">=", 22: "==", 23: "!=", 24: "=~", 25: "!=~", 27: "in", 29: "notIn", 31: "&&", 33: "||", 35: ",", 37: "IDENTIFIER", 38: "(", 39: ")", 42: ".", 44: "STRING", 46: "NUMBER", 48: "REGEXP", 50: "BOOLEAN", 52: "NULL", 53: "[", 54: "]"},
        productions_: [0, [3, 2], [6, 1], [6, 2], [9, 1], [9, 3], [9, 3], [12, 1], [12, 3], [12, 3], [14, 1], [14, 3], [16, 1], [16, 3], [16, 3], [16, 3], [16, 3], [21, 1], [21, 3], [21, 3], [21, 3], [21, 3], [26, 1], [26, 3], [26, 3], [30, 1], [30, 3], [32, 1], [32, 3], [34, 1], [34, 3], [36, 3], [36, 4], [40, 1], [40, 3], [40, 3], [41, 1], [43, 1], [45, 1], [47, 1], [49, 1], [51, 1], [28, 2], [28, 3], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 3], [4, 1]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

            var $0 = $$.length - 1;
            switch (yystate) {
                case 1:
                    return $$[$0 - 1];
                    break;
                case 3:
                    this.$ = [$$[$0], null, 'unminus'];
                    break;
                case 5:
                    this.$ = [$$[$0 - 2], $$[$0], 'mult'];
                    break;
                case 6:
                    this.$ = [$$[$0 - 2], $$[$0], 'div'];
                    break;
                case 8:
                    this.$ = [$$[$0 - 2], $$[$0], 'plus'];
                    break;
                case 9:
                    this.$ = [$$[$0 - 2], $$[$0], 'minus'];
                    break;
                case 11:
                    this.$ = [$$[$0 - 2], $$[$0], 'pow'];
                    break;
                case 13:
                    this.$ = [$$[$0 - 2], $$[$0], 'lt'];
                    break;
                case 14:
                    this.$ = [$$[$0 - 2], $$[$0], 'gt'];
                    break;
                case 15:
                    this.$ = [$$[$0 - 2], $$[$0], 'lte'];
                    break;
                case 16:
                    this.$ = [$$[$0 - 2], $$[$0], 'gte'];
                    break;
                case 18:
                    this.$ = [$$[$0 - 2], $$[$0], 'eq'];
                    break;
                case 19:
                    this.$ = [$$[$0 - 2], $$[$0], 'neq'];
                    break;
                case 20:
                    this.$ = [$$[$0 - 2], $$[$0], 'like'];
                    break;
                case 21:
                    this.$ = [$$[$0 - 2], $$[$0], 'notLike'];
                    break;
                case 23:
                    this.$ = [$$[$0 - 2], $$[$0], 'in'];
                    break;
                case 24:
                    this.$ = [$$[$0 - 2], $$[$0], 'notIn'];
                    break;
                case 26:
                    this.$ = [$$[$0 - 2], $$[$0], 'and'];
                    break;
                case 28:
                    this.$ = [$$[$0 - 2], $$[$0], 'or'];
                    break;
                case 30:
                    this.$ = [$$[$0 - 2], $$[$0], 'arguments']
                    break;
                case 31:
                    this.$ = [$$[$0 - 2], [null, null, 'arguments'], 'function']
                    break;
                case 32:
                    this.$ = [$$[$0 - 3], $$[$0 - 1], 'function']
                    break;
                case 34:
                    this.$ = [$$[$0 - 2], $$[$0], 'prop'];
                    break;
                case 35:
                    this.$ = [$$[$0 - 2], $$[$0], 'prop'];
                    break;
                case 36:
                    this.$ = [String(yytext), null, 'identifier'];
                    break;
                case 37:
                    this.$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];
                    break;
                case 38:
                    this.$ = [Number(yytext), null, 'number'];
                    break;
                case 39:
                    this.$ = [RegExp(yytext.replace(/^\/|\/$/g, '')), null, 'regexp'];
                    break;
                case 40:
                    this.$ = [yytext == 'true', null, 'boolean'];
                    break;
                case 41:
                    this.$ = [null, null, 'null'];
                    break;
                case 42:
                    this.$ = [null, null, 'array'];
                    break;
                case 43:
                    this.$ = [$$[$0 - 1], null, 'array'];
                    break;
                case 52:
                    this.$ = [$$[$0 - 1], null, 'composite']
                    break;
            }
        },
        table: [
            {3: 1, 4: 2, 6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 4, 32: 3, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {1: [3]},
            {5: [1, 31]},
            {5: [2, 53], 33: [1, 32], 39: [2, 53]},
            {5: [2, 27], 31: [1, 33], 33: [2, 27], 39: [2, 27]},
            {5: [2, 25], 31: [2, 25], 33: [2, 25], 39: [2, 25]},
            {5: [2, 22], 22: [1, 34], 23: [1, 35], 24: [1, 36], 25: [1, 37], 31: [2, 22], 33: [2, 22], 39: [2, 22]},
            {5: [2, 2], 8: [2, 2], 10: [2, 2], 11: [2, 2], 13: [2, 2], 15: [2, 2], 17: [2, 2], 18: [2, 2], 19: [2, 2], 20: [2, 2], 22: [2, 2], 23: [2, 2], 24: [2, 2], 25: [2, 2], 27: [1, 38], 29: [1, 39], 31: [2, 2], 33: [2, 2], 39: [2, 2]},
            {5: [2, 17], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 17], 23: [2, 17], 24: [2, 17], 25: [2, 17], 31: [2, 17], 33: [2, 17], 39: [2, 17]},
            {5: [2, 44], 8: [2, 44], 10: [2, 44], 11: [2, 44], 13: [2, 44], 15: [2, 44], 17: [2, 44], 18: [2, 44], 19: [2, 44], 20: [2, 44], 22: [2, 44], 23: [2, 44], 24: [2, 44], 25: [2, 44], 27: [2, 44], 29: [2, 44], 31: [2, 44], 33: [2, 44], 35: [2, 44], 39: [2, 44], 54: [2, 44]},
            {5: [2, 45], 8: [2, 45], 10: [2, 45], 11: [2, 45], 13: [2, 45], 15: [2, 45], 17: [2, 45], 18: [2, 45], 19: [2, 45], 20: [2, 45], 22: [2, 45], 23: [2, 45], 24: [2, 45], 25: [2, 45], 27: [2, 45], 29: [2, 45], 31: [2, 45], 33: [2, 45], 35: [2, 45], 39: [2, 45], 54: [2, 45]},
            {5: [2, 46], 8: [2, 46], 10: [2, 46], 11: [2, 46], 13: [2, 46], 15: [2, 46], 17: [2, 46], 18: [2, 46], 19: [2, 46], 20: [2, 46], 22: [2, 46], 23: [2, 46], 24: [2, 46], 25: [2, 46], 27: [2, 46], 29: [2, 46], 31: [2, 46], 33: [2, 46], 35: [2, 46], 39: [2, 46], 54: [2, 46]},
            {5: [2, 47], 8: [2, 47], 10: [2, 47], 11: [2, 47], 13: [2, 47], 15: [2, 47], 17: [2, 47], 18: [2, 47], 19: [2, 47], 20: [2, 47], 22: [2, 47], 23: [2, 47], 24: [2, 47], 25: [2, 47], 27: [2, 47], 29: [2, 47], 31: [2, 47], 33: [2, 47], 35: [2, 47], 39: [2, 47], 54: [2, 47]},
            {5: [2, 48], 8: [2, 48], 10: [2, 48], 11: [2, 48], 13: [2, 48], 15: [2, 48], 17: [2, 48], 18: [2, 48], 19: [2, 48], 20: [2, 48], 22: [2, 48], 23: [2, 48], 24: [2, 48], 25: [2, 48], 27: [2, 48], 29: [2, 48], 31: [2, 48], 33: [2, 48], 35: [2, 48], 39: [2, 48], 54: [2, 48]},
            {5: [2, 49], 8: [2, 49], 10: [2, 49], 11: [2, 49], 13: [2, 49], 15: [2, 49], 17: [2, 49], 18: [2, 49], 19: [2, 49], 20: [2, 49], 22: [2, 49], 23: [2, 49], 24: [2, 49], 25: [2, 49], 27: [2, 49], 29: [2, 49], 31: [2, 49], 33: [2, 49], 35: [2, 49], 39: [2, 49], 54: [2, 49]},
            {5: [2, 50], 8: [2, 50], 10: [2, 50], 11: [2, 50], 13: [2, 50], 15: [2, 50], 17: [2, 50], 18: [2, 50], 19: [2, 50], 20: [2, 50], 22: [2, 50], 23: [2, 50], 24: [2, 50], 25: [2, 50], 27: [2, 50], 29: [2, 50], 31: [2, 50], 33: [2, 50], 35: [2, 50], 39: [2, 50], 54: [2, 50]},
            {5: [2, 51], 8: [2, 51], 10: [2, 51], 11: [2, 51], 13: [2, 51], 15: [2, 51], 17: [2, 51], 18: [2, 51], 19: [2, 51], 20: [2, 51], 22: [2, 51], 23: [2, 51], 24: [2, 51], 25: [2, 51], 27: [2, 51], 29: [2, 51], 31: [2, 51], 33: [2, 51], 35: [2, 51], 39: [2, 51], 42: [1, 44], 54: [2, 51]},
            {4: 45, 6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 4, 32: 3, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 12], 15: [1, 46], 17: [2, 12], 18: [2, 12], 19: [2, 12], 20: [2, 12], 22: [2, 12], 23: [2, 12], 24: [2, 12], 25: [2, 12], 31: [2, 12], 33: [2, 12], 39: [2, 12]},
            {5: [2, 37], 8: [2, 37], 10: [2, 37], 11: [2, 37], 13: [2, 37], 15: [2, 37], 17: [2, 37], 18: [2, 37], 19: [2, 37], 20: [2, 37], 22: [2, 37], 23: [2, 37], 24: [2, 37], 25: [2, 37], 27: [2, 37], 29: [2, 37], 31: [2, 37], 33: [2, 37], 35: [2, 37], 39: [2, 37], 54: [2, 37]},
            {5: [2, 38], 8: [2, 38], 10: [2, 38], 11: [2, 38], 13: [2, 38], 15: [2, 38], 17: [2, 38], 18: [2, 38], 19: [2, 38], 20: [2, 38], 22: [2, 38], 23: [2, 38], 24: [2, 38], 25: [2, 38], 27: [2, 38], 29: [2, 38], 31: [2, 38], 33: [2, 38], 35: [2, 38], 39: [2, 38], 54: [2, 38]},
            {5: [2, 39], 8: [2, 39], 10: [2, 39], 11: [2, 39], 13: [2, 39], 15: [2, 39], 17: [2, 39], 18: [2, 39], 19: [2, 39], 20: [2, 39], 22: [2, 39], 23: [2, 39], 24: [2, 39], 25: [2, 39], 27: [2, 39], 29: [2, 39], 31: [2, 39], 33: [2, 39], 35: [2, 39], 39: [2, 39], 54: [2, 39]},
            {5: [2, 40], 8: [2, 40], 10: [2, 40], 11: [2, 40], 13: [2, 40], 15: [2, 40], 17: [2, 40], 18: [2, 40], 19: [2, 40], 20: [2, 40], 22: [2, 40], 23: [2, 40], 24: [2, 40], 25: [2, 40], 27: [2, 40], 29: [2, 40], 31: [2, 40], 33: [2, 40], 35: [2, 40], 39: [2, 40], 54: [2, 40]},
            {5: [2, 41], 8: [2, 41], 10: [2, 41], 11: [2, 41], 13: [2, 41], 15: [2, 41], 17: [2, 41], 18: [2, 41], 19: [2, 41], 20: [2, 41], 22: [2, 41], 23: [2, 41], 24: [2, 41], 25: [2, 41], 27: [2, 41], 29: [2, 41], 31: [2, 41], 33: [2, 41], 35: [2, 41], 39: [2, 41], 54: [2, 41]},
            {5: [2, 36], 8: [2, 36], 10: [2, 36], 11: [2, 36], 13: [2, 36], 15: [2, 36], 17: [2, 36], 18: [2, 36], 19: [2, 36], 20: [2, 36], 22: [2, 36], 23: [2, 36], 24: [2, 36], 25: [2, 36], 27: [2, 36], 29: [2, 36], 31: [2, 36], 33: [2, 36], 35: [2, 36], 38: [1, 47], 39: [2, 36], 42: [2, 36], 54: [2, 36]},
            {7: 50, 28: 15, 34: 49, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25], 54: [1, 48]},
            {5: [2, 33], 8: [2, 33], 10: [2, 33], 11: [2, 33], 13: [2, 33], 15: [2, 33], 17: [2, 33], 18: [2, 33], 19: [2, 33], 20: [2, 33], 22: [2, 33], 23: [2, 33], 24: [2, 33], 25: [2, 33], 27: [2, 33], 29: [2, 33], 31: [2, 33], 33: [2, 33], 35: [2, 33], 39: [2, 33], 42: [2, 33], 54: [2, 33]},
            {5: [2, 10], 8: [1, 52], 13: [1, 51], 15: [2, 10], 17: [2, 10], 18: [2, 10], 19: [2, 10], 20: [2, 10], 22: [2, 10], 23: [2, 10], 24: [2, 10], 25: [2, 10], 31: [2, 10], 33: [2, 10], 39: [2, 10]},
            {5: [2, 7], 8: [2, 7], 10: [1, 53], 11: [1, 54], 13: [2, 7], 15: [2, 7], 17: [2, 7], 18: [2, 7], 19: [2, 7], 20: [2, 7], 22: [2, 7], 23: [2, 7], 24: [2, 7], 25: [2, 7], 31: [2, 7], 33: [2, 7], 39: [2, 7]},
            {5: [2, 4], 8: [2, 4], 10: [2, 4], 11: [2, 4], 13: [2, 4], 15: [2, 4], 17: [2, 4], 18: [2, 4], 19: [2, 4], 20: [2, 4], 22: [2, 4], 23: [2, 4], 24: [2, 4], 25: [2, 4], 31: [2, 4], 33: [2, 4], 39: [2, 4]},
            {6: 55, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {1: [2, 1]},
            {6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 57, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 58, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 59, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 60, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 61, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 62, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {28: 63, 53: [1, 25]},
            {28: 64, 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 65, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 66, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 67, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 68, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {36: 70, 37: [1, 24], 41: 69},
            {39: [1, 71]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 72, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {7: 50, 28: 15, 34: 74, 36: 14, 37: [1, 24], 38: [1, 17], 39: [1, 73], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 42], 8: [2, 42], 10: [2, 42], 11: [2, 42], 13: [2, 42], 15: [2, 42], 17: [2, 42], 18: [2, 42], 19: [2, 42], 20: [2, 42], 22: [2, 42], 23: [2, 42], 24: [2, 42], 25: [2, 42], 27: [2, 42], 29: [2, 42], 31: [2, 42], 33: [2, 42], 35: [2, 42], 39: [2, 42], 54: [2, 42]},
            {35: [1, 76], 54: [1, 75]},
            {35: [2, 29], 39: [2, 29], 54: [2, 29]},
            {6: 29, 7: 56, 8: [1, 30], 9: 77, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 78, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 79, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 80, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 3], 8: [2, 3], 10: [2, 3], 11: [2, 3], 13: [2, 3], 15: [2, 3], 17: [2, 3], 18: [2, 3], 19: [2, 3], 20: [2, 3], 22: [2, 3], 23: [2, 3], 24: [2, 3], 25: [2, 3], 31: [2, 3], 33: [2, 3], 39: [2, 3]},
            {5: [2, 2], 8: [2, 2], 10: [2, 2], 11: [2, 2], 13: [2, 2], 15: [2, 2], 17: [2, 2], 18: [2, 2], 19: [2, 2], 20: [2, 2], 22: [2, 2], 23: [2, 2], 24: [2, 2], 25: [2, 2], 31: [2, 2], 33: [2, 2], 39: [2, 2]},
            {5: [2, 28], 31: [1, 33], 33: [2, 28], 39: [2, 28]},
            {5: [2, 26], 31: [2, 26], 33: [2, 26], 39: [2, 26]},
            {5: [2, 18], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 18], 23: [2, 18], 24: [2, 18], 25: [2, 18], 31: [2, 18], 33: [2, 18], 39: [2, 18]},
            {5: [2, 19], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 19], 23: [2, 19], 24: [2, 19], 25: [2, 19], 31: [2, 19], 33: [2, 19], 39: [2, 19]},
            {5: [2, 20], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 20], 23: [2, 20], 24: [2, 20], 25: [2, 20], 31: [2, 20], 33: [2, 20], 39: [2, 20]},
            {5: [2, 21], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 21], 23: [2, 21], 24: [2, 21], 25: [2, 21], 31: [2, 21], 33: [2, 21], 39: [2, 21]},
            {5: [2, 23], 31: [2, 23], 33: [2, 23], 39: [2, 23]},
            {5: [2, 24], 31: [2, 24], 33: [2, 24], 39: [2, 24]},
            {5: [2, 13], 15: [1, 46], 17: [2, 13], 18: [2, 13], 19: [2, 13], 20: [2, 13], 22: [2, 13], 23: [2, 13], 24: [2, 13], 25: [2, 13], 31: [2, 13], 33: [2, 13], 39: [2, 13]},
            {5: [2, 14], 15: [1, 46], 17: [2, 14], 18: [2, 14], 19: [2, 14], 20: [2, 14], 22: [2, 14], 23: [2, 14], 24: [2, 14], 25: [2, 14], 31: [2, 14], 33: [2, 14], 39: [2, 14]},
            {5: [2, 15], 15: [1, 46], 17: [2, 15], 18: [2, 15], 19: [2, 15], 20: [2, 15], 22: [2, 15], 23: [2, 15], 24: [2, 15], 25: [2, 15], 31: [2, 15], 33: [2, 15], 39: [2, 15]},
            {5: [2, 16], 15: [1, 46], 17: [2, 16], 18: [2, 16], 19: [2, 16], 20: [2, 16], 22: [2, 16], 23: [2, 16], 24: [2, 16], 25: [2, 16], 31: [2, 16], 33: [2, 16], 39: [2, 16]},
            {5: [2, 34], 8: [2, 34], 10: [2, 34], 11: [2, 34], 13: [2, 34], 15: [2, 34], 17: [2, 34], 18: [2, 34], 19: [2, 34], 20: [2, 34], 22: [2, 34], 23: [2, 34], 24: [2, 34], 25: [2, 34], 27: [2, 34], 29: [2, 34], 31: [2, 34], 33: [2, 34], 35: [2, 34], 39: [2, 34], 42: [2, 34], 54: [2, 34]},
            {5: [2, 35], 8: [2, 35], 10: [2, 35], 11: [2, 35], 13: [2, 35], 15: [2, 35], 17: [2, 35], 18: [2, 35], 19: [2, 35], 20: [2, 35], 22: [2, 35], 23: [2, 35], 24: [2, 35], 25: [2, 35], 27: [2, 35], 29: [2, 35], 31: [2, 35], 33: [2, 35], 35: [2, 35], 39: [2, 35], 42: [2, 35], 54: [2, 35]},
            {5: [2, 52], 8: [2, 52], 10: [2, 52], 11: [2, 52], 13: [2, 52], 15: [2, 52], 17: [2, 52], 18: [2, 52], 19: [2, 52], 20: [2, 52], 22: [2, 52], 23: [2, 52], 24: [2, 52], 25: [2, 52], 27: [2, 52], 29: [2, 52], 31: [2, 52], 33: [2, 52], 35: [2, 52], 39: [2, 52], 54: [2, 52]},
            {5: [2, 11], 8: [1, 52], 13: [1, 51], 15: [2, 11], 17: [2, 11], 18: [2, 11], 19: [2, 11], 20: [2, 11], 22: [2, 11], 23: [2, 11], 24: [2, 11], 25: [2, 11], 31: [2, 11], 33: [2, 11], 39: [2, 11]},
            {5: [2, 31], 8: [2, 31], 10: [2, 31], 11: [2, 31], 13: [2, 31], 15: [2, 31], 17: [2, 31], 18: [2, 31], 19: [2, 31], 20: [2, 31], 22: [2, 31], 23: [2, 31], 24: [2, 31], 25: [2, 31], 27: [2, 31], 29: [2, 31], 31: [2, 31], 33: [2, 31], 35: [2, 31], 39: [2, 31], 42: [2, 31], 54: [2, 31]},
            {35: [1, 76], 39: [1, 81]},
            {5: [2, 43], 8: [2, 43], 10: [2, 43], 11: [2, 43], 13: [2, 43], 15: [2, 43], 17: [2, 43], 18: [2, 43], 19: [2, 43], 20: [2, 43], 22: [2, 43], 23: [2, 43], 24: [2, 43], 25: [2, 43], 27: [2, 43], 29: [2, 43], 31: [2, 43], 33: [2, 43], 35: [2, 43], 39: [2, 43], 54: [2, 43]},
            {7: 82, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 8], 8: [2, 8], 10: [1, 53], 11: [1, 54], 13: [2, 8], 15: [2, 8], 17: [2, 8], 18: [2, 8], 19: [2, 8], 20: [2, 8], 22: [2, 8], 23: [2, 8], 24: [2, 8], 25: [2, 8], 31: [2, 8], 33: [2, 8], 39: [2, 8]},
            {5: [2, 9], 8: [2, 9], 10: [1, 53], 11: [1, 54], 13: [2, 9], 15: [2, 9], 17: [2, 9], 18: [2, 9], 19: [2, 9], 20: [2, 9], 22: [2, 9], 23: [2, 9], 24: [2, 9], 25: [2, 9], 31: [2, 9], 33: [2, 9], 39: [2, 9]},
            {5: [2, 5], 8: [2, 5], 10: [2, 5], 11: [2, 5], 13: [2, 5], 15: [2, 5], 17: [2, 5], 18: [2, 5], 19: [2, 5], 20: [2, 5], 22: [2, 5], 23: [2, 5], 24: [2, 5], 25: [2, 5], 31: [2, 5], 33: [2, 5], 39: [2, 5]},
            {5: [2, 6], 8: [2, 6], 10: [2, 6], 11: [2, 6], 13: [2, 6], 15: [2, 6], 17: [2, 6], 18: [2, 6], 19: [2, 6], 20: [2, 6], 22: [2, 6], 23: [2, 6], 24: [2, 6], 25: [2, 6], 31: [2, 6], 33: [2, 6], 39: [2, 6]},
            {5: [2, 32], 8: [2, 32], 10: [2, 32], 11: [2, 32], 13: [2, 32], 15: [2, 32], 17: [2, 32], 18: [2, 32], 19: [2, 32], 20: [2, 32], 22: [2, 32], 23: [2, 32], 24: [2, 32], 25: [2, 32], 27: [2, 32], 29: [2, 32], 31: [2, 32], 33: [2, 32], 35: [2, 32], 39: [2, 32], 42: [2, 32], 54: [2, 32]},
            {35: [2, 30], 39: [2, 30], 54: [2, 30]}
        ],
        defaultActions: {31: [2, 1]},
        parseError: function parseError(str, hash) {
            throw new Error(str);
        },
        parse: function parse(input) {
            var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
            this.lexer.setInput(input);
            this.lexer.yy = this.yy;
            this.yy.lexer = this.lexer;
            this.yy.parser = this;
            if (typeof this.lexer.yylloc == "undefined")
                this.lexer.yylloc = {};
            var yyloc = this.lexer.yylloc;
            lstack.push(yyloc);
            var ranges = this.lexer.options && this.lexer.options.ranges;
            if (typeof this.yy.parseError === "function")
                this.parseError = this.yy.parseError;
            function popStack(n) {
                stack.length = stack.length - 2 * n;
                vstack.length = vstack.length - n;
                lstack.length = lstack.length - n;
            }

            function lex() {
                var token;
                token = self.lexer.lex() || 1;
                if (typeof token !== "number") {
                    token = self.symbols_[token] || token;
                }
                return token;
            }

            var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
            while (true) {
                state = stack[stack.length - 1];
                if (this.defaultActions[state]) {
                    action = this.defaultActions[state];
                } else {
                    if (symbol === null || typeof symbol == "undefined") {
                        symbol = lex();
                    }
                    action = table[state] && table[state][symbol];
                }
                if (typeof action === "undefined" || !action.length || !action[0]) {
                    var errStr = "";
                    if (!recovering) {
                        expected = [];
                        for (p in table[state])
                            if (this.terminals_[p] && p > 2) {
                                expected.push("'" + this.terminals_[p] + "'");
                            }
                        if (this.lexer.showPosition) {
                            errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                        } else {
                            errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                        }
                        this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
                    }
                }
                if (action[0] instanceof Array && action.length > 1) {
                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                }
                switch (action[0]) {
                    case 1:
                        stack.push(symbol);
                        vstack.push(this.lexer.yytext);
                        lstack.push(this.lexer.yylloc);
                        stack.push(action[1]);
                        symbol = null;
                        if (!preErrorSymbol) {
                            yyleng = this.lexer.yyleng;
                            yytext = this.lexer.yytext;
                            yylineno = this.lexer.yylineno;
                            yyloc = this.lexer.yylloc;
                            if (recovering > 0)
                                recovering--;
                        } else {
                            symbol = preErrorSymbol;
                            preErrorSymbol = null;
                        }
                        break;
                    case 2:
                        len = this.productions_[action[1]][1];
                        yyval.$ = vstack[vstack.length - len];
                        yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
                        if (ranges) {
                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                        }
                        r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                        if (typeof r !== "undefined") {
                            return r;
                        }
                        if (len) {
                            stack = stack.slice(0, -1 * len * 2);
                            vstack = vstack.slice(0, -1 * len);
                            lstack = lstack.slice(0, -1 * len);
                        }
                        stack.push(this.productions_[action[1]][0]);
                        vstack.push(yyval.$);
                        lstack.push(yyval._$);
                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                        stack.push(newState);
                        break;
                    case 3:
                        return true;
                }
            }
            return true;
        }
    };
    undefined
    /* Jison generated lexer */
    var lexer = (function () {
        var lexer = ({EOF: 1,
            parseError: function parseError(str, hash) {
                if (this.yy.parser) {
                    this.yy.parser.parseError(str, hash);
                } else {
                    throw new Error(str);
                }
            },
            setInput: function (input) {
                this._input = input;
                this._more = this._less = this.done = false;
                this.yylineno = this.yyleng = 0;
                this.yytext = this.matched = this.match = '';
                this.conditionStack = ['INITIAL'];
                this.yylloc = {first_line: 1, first_column: 0, last_line: 1, last_column: 0};
                if (this.options.ranges) this.yylloc.range = [0, 0];
                this.offset = 0;
                return this;
            },
            input: function () {
                var ch = this._input[0];
                this.yytext += ch;
                this.yyleng++;
                this.offset++;
                this.match += ch;
                this.matched += ch;
                var lines = ch.match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno++;
                    this.yylloc.last_line++;
                } else {
                    this.yylloc.last_column++;
                }
                if (this.options.ranges) this.yylloc.range[1]++;

                this._input = this._input.slice(1);
                return ch;
            },
            unput: function (ch) {
                var len = ch.length;
                var lines = ch.split(/(?:\r\n?|\n)/g);

                this._input = ch + this._input;
                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                //this.yyleng -= len;
                this.offset -= len;
                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                this.match = this.match.substr(0, this.match.length - 1);
                this.matched = this.matched.substr(0, this.matched.length - 1);

                if (lines.length - 1) this.yylineno -= lines.length - 1;
                var r = this.yylloc.range;

                this.yylloc = {first_line: this.yylloc.first_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.first_column,
                    last_column: lines ?
                        (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length :
                        this.yylloc.first_column - len
                };

                if (this.options.ranges) {
                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                }
                return this;
            },
            more: function () {
                this._more = true;
                return this;
            },
            less: function (n) {
                this.unput(this.match.slice(n));
            },
            pastInput: function () {
                var past = this.matched.substr(0, this.matched.length - this.match.length);
                return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
            },
            upcomingInput: function () {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
            },
            showPosition: function () {
                var pre = this.pastInput();
                var c = new Array(pre.length + 1).join("-");
                return pre + this.upcomingInput() + "\n" + c + "^";
            },
            next: function () {
                if (this.done) {
                    return this.EOF;
                }
                if (!this._input) this.done = true;

                var token,
                    match,
                    tempMatch,
                    index,
                    col,
                    lines;
                if (!this._more) {
                    this.yytext = '';
                    this.match = '';
                }
                var rules = this._currentRules();
                for (var i = 0; i < rules.length; i++) {
                    tempMatch = this._input.match(this.rules[rules[i]]);
                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                        match = tempMatch;
                        index = i;
                        if (!this.options.flex) break;
                    }
                }
                if (match) {
                    lines = match[0].match(/(?:\r\n?|\n).*/g);
                    if (lines) this.yylineno += lines.length;
                    this.yylloc = {first_line: this.yylloc.last_line,
                        last_line: this.yylineno + 1,
                        first_column: this.yylloc.last_column,
                        last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
                    this.yytext += match[0];
                    this.match += match[0];
                    this.matches = match;
                    this.yyleng = this.yytext.length;
                    if (this.options.ranges) {
                        this.yylloc.range = [this.offset, this.offset += this.yyleng];
                    }
                    this._more = false;
                    this._input = this._input.slice(match[0].length);
                    this.matched += match[0];
                    token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                    if (this.done && this._input) this.done = false;
                    if (token) return token;
                    else return;
                }
                if (this._input === "") {
                    return this.EOF;
                } else {
                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(),
                        {text: "", token: null, line: this.yylineno});
                }
            },
            lex: function lex() {
                var r = this.next();
                if (typeof r !== 'undefined') {
                    return r;
                } else {
                    return this.lex();
                }
            },
            begin: function begin(condition) {
                this.conditionStack.push(condition);
            },
            popState: function popState() {
                return this.conditionStack.pop();
            },
            _currentRules: function _currentRules() {
                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
            },
            topState: function () {
                return this.conditionStack[this.conditionStack.length - 2];
            },
            pushState: function begin(condition) {
                this.begin(condition);
            }});
        lexer.options = {};
        lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

            var YYSTATE = YY_START
            switch ($avoiding_name_collisions) {
                case 0:
                    return 27;
                    break;
                case 1:
                    return 29;
                    break;
                case 2:/* skip whitespace */
                    break;
                case 3:
                    return 46;
                    break;
                case 4:
                    return 52;
                    break;
                case 5:
                    return 22;
                    break;
                case 6:
                    return 23;
                    break;
                case 7:
                    return 19;
                    break;
                case 8:
                    return 17;
                    break;
                case 9:
                    return 20;
                    break;
                case 10:
                    return 18;
                    break;
                case 11:
                    return 24;
                    break;
                case 12:
                    return 25;
                    break;
                case 13:
                    return 31;
                    break;
                case 14:
                    return 33;
                    break;
                case 15:
                    return 50;
                    break;
                case 16:
                    return 44;
                    break;
                case 17:
                    return 37;
                    break;
                case 18:
                    return 48;
                    break;
                case 19:
                    return 42;
                    break;
                case 20:
                    return 10;
                    break;
                case 21:
                    return 11;
                    break;
                case 22:
                    return 35;
                    break;
                case 23:
                    return 8;
                    break;
                case 24:
                    return 24;
                    break;
                case 25:
                    return 25;
                    break;
                case 26:
                    return 22;
                    break;
                case 27:
                    return 22;
                    break;
                case 28:
                    return 23;
                    break;
                case 29:
                    return 23;
                    break;
                case 30:
                    return 19;
                    break;
                case 31:
                    return 20;
                    break;
                case 32:
                    return 18;
                    break;
                case 33:
                    return 17;
                    break;
                case 34:
                    return 31;
                    break;
                case 35:
                    return 33;
                    break;
                case 36:
                    return 13;
                    break;
                case 37:
                    return 15;
                    break;
                case 38:
                    return 38;
                    break;
                case 39:
                    return 54;
                    break;
                case 40:
                    return 53;
                    break;
                case 41:
                    return 39;
                    break;
                case 42:
                    return 5;
                    break;
            }
        };
        lexer.rules = [/^(?:\s+in\b)/, /^(?:\s+notIn\b)/, /^(?:\s+)/, /^(?:[0-9]+(?:\.[0-9]+)?\b)/, /^(?:null\b)/, /^(?:(eq|EQ))/, /^(?:(neq|NEQ))/, /^(?:(lte|LTE))/, /^(?:(lt|LT))/, /^(?:(gte|GTE))/, /^(?:(gt|GT))/, /^(?:(like|LIKE))/, /^(?:(notLike|NOT_LIKE))/, /^(?:(and|AND))/, /^(?:(or|OR))/, /^(?:(true|false))/, /^(?:'[^']*')/, /^(?:[a-zA-Z0-9]+)/, /^(?:\/(.*)\/)/, /^(?:\.)/, /^(?:\*)/, /^(?:\/)/, /^(?:,)/, /^(?:-)/, /^(?:=~)/, /^(?:!=~)/, /^(?:==)/, /^(?:===)/, /^(?:!=)/, /^(?:!==)/, /^(?:<=)/, /^(?:>=)/, /^(?:>)/, /^(?:<)/, /^(?:&&)/, /^(?:\|\|)/, /^(?:\+)/, /^(?:\^)/, /^(?:\()/, /^(?:\])/, /^(?:\[)/, /^(?:\))/, /^(?:$)/];
        lexer.conditions = {"INITIAL": {"rules": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], "inclusive": true}};
        return lexer;
    })()
    parser.lexer = lexer;
    function Parser() {
        this.yy = {};
    }

    Parser.prototype = parser;
    parser.Parser = Parser;
    return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
    exports.parser = parser;
    exports.Parser = parser.Parser;
    exports.parse = function () {
        return parser.parse.apply(parser, arguments);
    }
    exports.main = function commonjsMain(args) {
        if (!args[1])
            throw new Error('Usage: ' + args[0] + ' FILE');
        var source, cwd;
        return exports.parser.parse(source);
    }

}