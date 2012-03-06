/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"&&":6,"||":7,".":8,"+":9,"-":10,"*":11,"/":12,"<":13,">":14,"<=":15,">=":16,"=~":17,"==":18,"!=":19,"^":20,"(":21,")":22,"STRING":23,"NUMBER":24,"REGEXP":25,"BOOLEAN":26,"IDENTIFIER":27,"NULL":28,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"&&",7:"||",8:".",9:"+",10:"-",11:"*",12:"/",13:"<",14:">",15:"<=",16:">=",17:"=~",18:"==",19:"!=",20:"^",21:"(",22:")",23:"STRING",24:"NUMBER",25:"REGEXP",26:"BOOLEAN",27:"IDENTIFIER",28:"NULL"},
productions_: [0,[3,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,3],[4,1],[4,1],[4,1],[4,1],[4,1],[4,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1];
break;
case 2:this.$ = [$$[$0-2], $$[$0], 'and'];
break;
case 3:this.$ = [$$[$0-2], $$[$0], 'or'];
break;
case 4:this.$ = [$$[$0-2],$$[$0], 'prop'];
break;
case 5:this.$ = [$$[$0-2], $$[$0], 'plus'];
break;
case 6:this.$ = [$$[$0-2], $$[$0], 'minus'];
break;
case 7:this.$ = [$$[$0-2], $$[$0], 'mult'];
break;
case 8:this.$ = [$$[$0-2], $$[$0], 'div'];
break;
case 9:this.$ = [$$[$0-2], $$[$0], 'lt'];
break;
case 10:this.$ = [$$[$0-2], $$[$0], 'gt'];
break;
case 11:this.$ = [$$[$0-2], $$[$0], 'lte'];
break;
case 12:this.$ = [$$[$0-2], $$[$0], 'gte'];
break;
case 13:this.$ = [$$[$0-2], $$[$0], 'like'];
break;
case 14:this.$ = [$$[$0-2], $$[$0], 'eq'];
break;
case 15:this.$ = [$$[$0-2], $$[$0], 'neq'];
break;
case 16:this.$ = [$$[$0-2], $$[$0], 'pow'];
break;
case 17:this.$ = [$$[$0], null, 'unminus'];
break;
case 18:this.$ = ($$[$0-1]);
break;
case 19:this.$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];
break;
case 20:this.$ = [Number(yytext), null, 'number'];
break;
case 21:this.$ = [RegExp(yytext.replace(/^\/|\/$/g, '')), null, 'regexp'];
break;
case 22:this.$ = [yytext == 'true', null, 'boolean'];
break;
case 23:this.$ = [String(yytext), null, 'identifier'];
break;
case 24:this.$ = [null, null, 'null'];
break;
}
},
table: [{3:1,4:2,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{1:[3]},{5:[1,11],6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22],17:[1,23],18:[1,24],19:[1,25],20:[1,26]},{4:27,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:28,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{5:[2,19],6:[2,19],7:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],14:[2,19],15:[2,19],16:[2,19],17:[2,19],18:[2,19],19:[2,19],20:[2,19],22:[2,19]},{5:[2,20],6:[2,20],7:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],14:[2,20],15:[2,20],16:[2,20],17:[2,20],18:[2,20],19:[2,20],20:[2,20],22:[2,20]},{5:[2,21],6:[2,21],7:[2,21],8:[2,21],9:[2,21],10:[2,21],11:[2,21],12:[2,21],13:[2,21],14:[2,21],15:[2,21],16:[2,21],17:[2,21],18:[2,21],19:[2,21],20:[2,21],22:[2,21]},{5:[2,22],6:[2,22],7:[2,22],8:[2,22],9:[2,22],10:[2,22],11:[2,22],12:[2,22],13:[2,22],14:[2,22],15:[2,22],16:[2,22],17:[2,22],18:[2,22],19:[2,22],20:[2,22],22:[2,22]},{5:[2,23],6:[2,23],7:[2,23],8:[2,23],9:[2,23],10:[2,23],11:[2,23],12:[2,23],13:[2,23],14:[2,23],15:[2,23],16:[2,23],17:[2,23],18:[2,23],19:[2,23],20:[2,23],22:[2,23]},{5:[2,24],6:[2,24],7:[2,24],8:[2,24],9:[2,24],10:[2,24],11:[2,24],12:[2,24],13:[2,24],14:[2,24],15:[2,24],16:[2,24],17:[2,24],18:[2,24],19:[2,24],20:[2,24],22:[2,24]},{1:[2,1]},{4:29,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:30,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:31,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:32,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:33,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:34,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:35,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:36,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:37,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:38,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:39,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:40,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:41,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:42,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{4:43,10:[1,3],21:[1,4],23:[1,5],24:[1,6],25:[1,7],26:[1,8],27:[1,9],28:[1,10]},{5:[2,17],6:[2,17],7:[2,17],8:[1,14],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],14:[2,17],15:[2,17],16:[2,17],17:[2,17],18:[2,17],19:[2,17],20:[2,17],22:[2,17]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[1,44]},{5:[2,2],6:[2,2],7:[2,2],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,2]},{5:[2,3],6:[2,3],7:[2,3],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,3]},{5:[2,4],6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[2,4],11:[2,4],12:[2,4],13:[2,4],14:[2,4],15:[2,4],16:[2,4],17:[2,4],18:[2,4],19:[2,4],20:[2,4],22:[2,4]},{5:[2,5],6:[2,5],7:[2,5],8:[1,14],9:[2,5],10:[2,5],11:[2,5],12:[2,5],13:[2,5],14:[2,5],15:[2,5],16:[2,5],17:[2,5],18:[2,5],19:[2,5],20:[2,5],22:[2,5]},{5:[2,6],6:[2,6],7:[2,6],8:[1,14],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[2,6],17:[2,6],18:[2,6],19:[2,6],20:[2,6],22:[2,6]},{5:[2,7],6:[2,7],7:[2,7],8:[1,14],9:[1,15],10:[1,16],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[2,7],17:[2,7],18:[2,7],19:[2,7],20:[2,7],22:[2,7]},{5:[2,8],6:[2,8],7:[2,8],8:[1,14],9:[1,15],10:[1,16],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],17:[2,8],18:[2,8],19:[2,8],20:[2,8],22:[2,8]},{5:[2,9],6:[2,9],7:[2,9],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,9],14:[2,9],15:[2,9],16:[2,9],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,9]},{5:[2,10],6:[2,10],7:[2,10],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,10],14:[2,10],15:[2,10],16:[2,10],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,10]},{5:[2,11],6:[2,11],7:[2,11],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,11],14:[2,11],15:[2,11],16:[2,11],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,11]},{5:[2,12],6:[2,12],7:[2,12],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,12],14:[2,12],15:[2,12],16:[2,12],17:[1,23],18:[1,24],19:[1,25],20:[1,26],22:[2,12]},{5:[2,13],6:[2,13],7:[2,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,13],14:[2,13],15:[2,13],16:[2,13],17:[2,13],18:[2,13],19:[2,13],20:[1,26],22:[2,13]},{5:[2,14],6:[2,14],7:[2,14],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14],18:[2,14],19:[2,14],20:[1,26],22:[2,14]},{5:[2,15],6:[2,15],7:[2,15],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,15],14:[2,15],15:[2,15],16:[2,15],17:[2,15],18:[2,15],19:[2,15],20:[1,26],22:[2,15]},{5:[2,16],6:[2,16],7:[2,16],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[2,16],14:[2,16],15:[2,16],16:[2,16],17:[2,16],18:[2,16],19:[2,16],20:[2,16],22:[2,16]},{5:[2,18],6:[2,18],7:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],14:[2,18],15:[2,18],16:[2,18],17:[2,18],18:[2,18],19:[2,18],20:[2,18],22:[2,18]}],
defaultActions: {11:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
undefined/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
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
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/\n.*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
            this.yytext += match[0];
            this.match += match[0];
            this.yyleng = this.yytext.length;
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 24;
break;
case 2:return 28;
break;
case 3:return 18;
break;
case 4:return 19;
break;
case 5:return 15;
break;
case 6:return 13;
break;
case 7:return 16;
break;
case 8:return 14;
break;
case 9:return 17;
break;
case 10:return 6;
break;
case 11:return 7;
break;
case 12:return 26;
break;
case 13:return 23;
break;
case 14:return 27;
break;
case 15:return 25;
break;
case 16:return 8;
break;
case 17:return 11;
break;
case 18:return 12;
break;
case 19:return 10;
break;
case 20:return 17;
break;
case 21:return 18;
break;
case 22:return 19;
break;
case 23:return 15;
break;
case 24:return 16;
break;
case 25:return 14;
break;
case 26:return 13;
break;
case 27:return 6;
break;
case 28:return 7;
break;
case 29:return 9;
break;
case 30:return 20;
break;
case 31:return 21;
break;
case 32:return 22;
break;
case 33:return 5;
break;
}
};
lexer.rules = [/^\s+/,/^[0-9]+(?:\.[0-9]+)?\b/,/^null\b/,/^(eq|EQ)/,/^(neq|NEQ)/,/^(lte|LTE)/,/^(lt|LT)/,/^(gte|GTE)/,/^(gt|GT)/,/^(like|LIKE)/,/^(and|AND)/,/^(or|OR)/,/^(true|false)/,/^'[a-zA-Z0-9]+'/,/^[a-zA-Z0-9]+/,/^\/(.*)\//,/^\./,/^\*/,/^\//,/^-/,/^=~/,/^==/,/^!=/,/^<=/,/^>=/,/^>/,/^</,/^&&/,/^\|\|/,/^\+/,/^\^/,/^\(/,/^\)/,/^$/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}