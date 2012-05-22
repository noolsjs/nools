/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"EXPRESSION":4,"EOF":5,"UNARY_EXPRESSION":6,"LITERAL_EXPRESSION":7,"-":8,"MULTIPLICATIVE_EXPRESSION":9,"*":10,"/":11,"ADDITIVE_EXPRESSION":12,"+":13,"EXPONENT_EXPRESSION":14,"^":15,"RELATIONAL_EXPRESSION":16,"<":17,">":18,"<=":19,">=":20,"EQUALITY_EXPRESSION":21,"==":22,"!=":23,"=~":24,"IN_EXPRESSION":25,"in":26,"ARRAY_EXPRESSION":27,"AND_EXPRESSION":28,"&&":29,"OR_EXPRESSION":30,"||":31,"ARGUMENT_LIST":32,",":33,"FUNCTION":34,"IDENTIFIER":35,"(":36,")":37,"OBJECT_EXPRESSION":38,"IDENTIFIER_EXPRESSION":39,".":40,"STRING_EXPRESSION":41,"STRING":42,"NUMBER_EXPRESSION":43,"NUMBER":44,"REGEXP_EXPRESSION":45,"REGEXP":46,"BOOLEAN_EXPRESSION":47,"BOOLEAN":48,"NULL_EXPRESSION":49,"NULL":50,"[":51,"]":52,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"-",10:"*",11:"/",13:"+",15:"^",17:"<",18:">",19:"<=",20:">=",22:"==",23:"!=",24:"=~",26:"in",29:"&&",31:"||",33:",",35:"IDENTIFIER",36:"(",37:")",40:".",42:"STRING",44:"NUMBER",46:"REGEXP",48:"BOOLEAN",50:"NULL",51:"[",52:"]"},
productions_: [0,[3,2],[6,1],[6,2],[9,1],[9,3],[9,3],[12,1],[12,3],[12,3],[14,1],[14,3],[16,1],[16,3],[16,3],[16,3],[16,3],[21,1],[21,3],[21,3],[21,3],[25,1],[25,3],[28,1],[28,3],[30,1],[30,3],[32,1],[32,3],[34,3],[34,4],[38,1],[38,3],[38,3],[39,1],[41,1],[43,1],[45,1],[47,1],[49,1],[27,2],[27,3],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,3],[4,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1];
break;
case 3:this.$ = [$$[$0], null, 'unminus'];
break;
case 5:this.$ = [$$[$0-2], $$[$0], 'mult'];
break;
case 6:this.$ = [$$[$0-2], $$[$0], 'div'];
break;
case 8:this.$ = [$$[$0-2], $$[$0], 'plus'];
break;
case 9:this.$ = [$$[$0-2], $$[$0], 'minus'];
break;
case 11:this.$ = [$$[$0-2], $$[$0], 'pow'];
break;
case 13:this.$ = [$$[$0-2], $$[$0], 'lt'];
break;
case 14:this.$ = [$$[$0-2], $$[$0], 'gt'];
break;
case 15:this.$ = [$$[$0-2], $$[$0], 'lte'];
break;
case 16:this.$ = [$$[$0-2], $$[$0], 'gte'];
break;
case 18:this.$ = [$$[$0-2], $$[$0], 'eq'];
break;
case 19:this.$ = [$$[$0-2], $$[$0], 'neq'];
break;
case 20:this.$ = [$$[$0-2], $$[$0], 'like'];
break;
case 22:this.$ = [$$[$0-2], $$[$0], 'in'];
break;
case 24:this.$ = [$$[$0-2], $$[$0], 'and'];
break;
case 26:this.$ = [$$[$0-2], $$[$0], 'or'];
break;
case 28:this.$ = [$$[$0-2], $$[$0], 'arguments']
break;
case 29:this.$ = [$$[$0-2], [null, null, 'arguments'], 'function']
break;
case 30:this.$ = [$$[$0-3], $$[$0-1], 'function']
break;
case 32:this.$ = [$$[$0-2],$$[$0], 'prop'];
break;
case 33:this.$ = [$$[$0-2],$$[$0], 'prop'];
break;
case 34:this.$ = [String(yytext), null, 'identifier'];
break;
case 35:this.$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];
break;
case 36:this.$ = [Number(yytext), null, 'number'];
break;
case 37:this.$ = [RegExp(yytext.replace(/^\/|\/$/g, '')), null, 'regexp'];
break;
case 38:this.$ = [yytext == 'true', null, 'boolean'];
break;
case 39:this.$ = [null, null, 'null'];
break;
case 40:this.$ = [null, null, 'array'];
break;
case 41:this.$ = [$$[$0-1], null, 'array'];
break;
case 50:this.$ = $$[$0-1]
break;
}
},
table: [{3:1,4:2,6:29,7:7,8:[1,30],9:28,12:27,14:18,16:8,21:6,25:5,27:15,28:4,30:3,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{1:[3]},{5:[1,31]},{5:[2,51],31:[1,32],37:[2,51]},{5:[2,25],29:[1,33],31:[2,25],37:[2,25]},{5:[2,23],29:[2,23],31:[2,23],37:[2,23]},{5:[2,21],22:[1,34],23:[1,35],24:[1,36],29:[2,21],31:[2,21],37:[2,21]},{5:[2,2],8:[2,2],10:[2,2],11:[2,2],13:[2,2],15:[2,2],17:[2,2],18:[2,2],19:[2,2],20:[2,2],22:[2,2],23:[2,2],24:[2,2],26:[1,37],29:[2,2],31:[2,2],37:[2,2]},{5:[2,17],17:[1,38],18:[1,39],19:[1,40],20:[1,41],22:[2,17],23:[2,17],24:[2,17],29:[2,17],31:[2,17],37:[2,17]},{5:[2,42],8:[2,42],10:[2,42],11:[2,42],13:[2,42],15:[2,42],17:[2,42],18:[2,42],19:[2,42],20:[2,42],22:[2,42],23:[2,42],24:[2,42],26:[2,42],29:[2,42],31:[2,42],33:[2,42],37:[2,42],52:[2,42]},{5:[2,43],8:[2,43],10:[2,43],11:[2,43],13:[2,43],15:[2,43],17:[2,43],18:[2,43],19:[2,43],20:[2,43],22:[2,43],23:[2,43],24:[2,43],26:[2,43],29:[2,43],31:[2,43],33:[2,43],37:[2,43],52:[2,43]},{5:[2,44],8:[2,44],10:[2,44],11:[2,44],13:[2,44],15:[2,44],17:[2,44],18:[2,44],19:[2,44],20:[2,44],22:[2,44],23:[2,44],24:[2,44],26:[2,44],29:[2,44],31:[2,44],33:[2,44],37:[2,44],52:[2,44]},{5:[2,45],8:[2,45],10:[2,45],11:[2,45],13:[2,45],15:[2,45],17:[2,45],18:[2,45],19:[2,45],20:[2,45],22:[2,45],23:[2,45],24:[2,45],26:[2,45],29:[2,45],31:[2,45],33:[2,45],37:[2,45],52:[2,45]},{5:[2,46],8:[2,46],10:[2,46],11:[2,46],13:[2,46],15:[2,46],17:[2,46],18:[2,46],19:[2,46],20:[2,46],22:[2,46],23:[2,46],24:[2,46],26:[2,46],29:[2,46],31:[2,46],33:[2,46],37:[2,46],52:[2,46]},{5:[2,47],8:[2,47],10:[2,47],11:[2,47],13:[2,47],15:[2,47],17:[2,47],18:[2,47],19:[2,47],20:[2,47],22:[2,47],23:[2,47],24:[2,47],26:[2,47],29:[2,47],31:[2,47],33:[2,47],37:[2,47],52:[2,47]},{5:[2,48],8:[2,48],10:[2,48],11:[2,48],13:[2,48],15:[2,48],17:[2,48],18:[2,48],19:[2,48],20:[2,48],22:[2,48],23:[2,48],24:[2,48],26:[2,48],29:[2,48],31:[2,48],33:[2,48],37:[2,48],52:[2,48]},{5:[2,49],8:[2,49],10:[2,49],11:[2,49],13:[2,49],15:[2,49],17:[2,49],18:[2,49],19:[2,49],20:[2,49],22:[2,49],23:[2,49],24:[2,49],26:[2,49],29:[2,49],31:[2,49],33:[2,49],37:[2,49],40:[1,42],52:[2,49]},{4:43,6:29,7:7,8:[1,30],9:28,12:27,14:18,16:8,21:6,25:5,27:15,28:4,30:3,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{5:[2,12],15:[1,44],17:[2,12],18:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],24:[2,12],29:[2,12],31:[2,12],37:[2,12]},{5:[2,35],8:[2,35],10:[2,35],11:[2,35],13:[2,35],15:[2,35],17:[2,35],18:[2,35],19:[2,35],20:[2,35],22:[2,35],23:[2,35],24:[2,35],26:[2,35],29:[2,35],31:[2,35],33:[2,35],37:[2,35],52:[2,35]},{5:[2,36],8:[2,36],10:[2,36],11:[2,36],13:[2,36],15:[2,36],17:[2,36],18:[2,36],19:[2,36],20:[2,36],22:[2,36],23:[2,36],24:[2,36],26:[2,36],29:[2,36],31:[2,36],33:[2,36],37:[2,36],52:[2,36]},{5:[2,37],8:[2,37],10:[2,37],11:[2,37],13:[2,37],15:[2,37],17:[2,37],18:[2,37],19:[2,37],20:[2,37],22:[2,37],23:[2,37],24:[2,37],26:[2,37],29:[2,37],31:[2,37],33:[2,37],37:[2,37],52:[2,37]},{5:[2,38],8:[2,38],10:[2,38],11:[2,38],13:[2,38],15:[2,38],17:[2,38],18:[2,38],19:[2,38],20:[2,38],22:[2,38],23:[2,38],24:[2,38],26:[2,38],29:[2,38],31:[2,38],33:[2,38],37:[2,38],52:[2,38]},{5:[2,39],8:[2,39],10:[2,39],11:[2,39],13:[2,39],15:[2,39],17:[2,39],18:[2,39],19:[2,39],20:[2,39],22:[2,39],23:[2,39],24:[2,39],26:[2,39],29:[2,39],31:[2,39],33:[2,39],37:[2,39],52:[2,39]},{5:[2,34],8:[2,34],10:[2,34],11:[2,34],13:[2,34],15:[2,34],17:[2,34],18:[2,34],19:[2,34],20:[2,34],22:[2,34],23:[2,34],24:[2,34],26:[2,34],29:[2,34],31:[2,34],33:[2,34],36:[1,45],37:[2,34],40:[2,34],52:[2,34]},{7:48,27:15,32:47,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25],52:[1,46]},{5:[2,31],8:[2,31],10:[2,31],11:[2,31],13:[2,31],15:[2,31],17:[2,31],18:[2,31],19:[2,31],20:[2,31],22:[2,31],23:[2,31],24:[2,31],26:[2,31],29:[2,31],31:[2,31],33:[2,31],37:[2,31],40:[2,31],52:[2,31]},{5:[2,10],8:[1,50],13:[1,49],15:[2,10],17:[2,10],18:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],24:[2,10],29:[2,10],31:[2,10],37:[2,10]},{5:[2,7],8:[2,7],10:[1,51],11:[1,52],13:[2,7],15:[2,7],17:[2,7],18:[2,7],19:[2,7],20:[2,7],22:[2,7],23:[2,7],24:[2,7],29:[2,7],31:[2,7],37:[2,7]},{5:[2,4],8:[2,4],10:[2,4],11:[2,4],13:[2,4],15:[2,4],17:[2,4],18:[2,4],19:[2,4],20:[2,4],22:[2,4],23:[2,4],24:[2,4],29:[2,4],31:[2,4],37:[2,4]},{6:53,7:54,8:[1,30],27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{1:[2,1]},{6:29,7:7,8:[1,30],9:28,12:27,14:18,16:8,21:6,25:5,27:15,28:55,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:7,8:[1,30],9:28,12:27,14:18,16:8,21:6,25:56,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:18,16:57,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:18,16:58,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:18,16:59,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{27:60,51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:61,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:62,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:63,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:28,12:27,14:64,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{34:66,35:[1,24],39:65},{37:[1,67]},{6:29,7:54,8:[1,30],9:28,12:68,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{7:48,27:15,32:70,34:14,35:[1,24],36:[1,17],37:[1,69],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{5:[2,40],8:[2,40],10:[2,40],11:[2,40],13:[2,40],15:[2,40],17:[2,40],18:[2,40],19:[2,40],20:[2,40],22:[2,40],23:[2,40],24:[2,40],26:[2,40],29:[2,40],31:[2,40],33:[2,40],37:[2,40],52:[2,40]},{33:[1,72],52:[1,71]},{33:[2,27],37:[2,27],52:[2,27]},{6:29,7:54,8:[1,30],9:73,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:29,7:54,8:[1,30],9:74,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:75,7:54,8:[1,30],27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{6:76,7:54,8:[1,30],27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{5:[2,3],8:[2,3],10:[2,3],11:[2,3],13:[2,3],15:[2,3],17:[2,3],18:[2,3],19:[2,3],20:[2,3],22:[2,3],23:[2,3],24:[2,3],29:[2,3],31:[2,3],37:[2,3]},{5:[2,2],8:[2,2],10:[2,2],11:[2,2],13:[2,2],15:[2,2],17:[2,2],18:[2,2],19:[2,2],20:[2,2],22:[2,2],23:[2,2],24:[2,2],29:[2,2],31:[2,2],37:[2,2]},{5:[2,26],29:[1,33],31:[2,26],37:[2,26]},{5:[2,24],29:[2,24],31:[2,24],37:[2,24]},{5:[2,18],17:[1,38],18:[1,39],19:[1,40],20:[1,41],22:[2,18],23:[2,18],24:[2,18],29:[2,18],31:[2,18],37:[2,18]},{5:[2,19],17:[1,38],18:[1,39],19:[1,40],20:[1,41],22:[2,19],23:[2,19],24:[2,19],29:[2,19],31:[2,19],37:[2,19]},{5:[2,20],17:[1,38],18:[1,39],19:[1,40],20:[1,41],22:[2,20],23:[2,20],24:[2,20],29:[2,20],31:[2,20],37:[2,20]},{5:[2,22],29:[2,22],31:[2,22],37:[2,22]},{5:[2,13],15:[1,44],17:[2,13],18:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],24:[2,13],29:[2,13],31:[2,13],37:[2,13]},{5:[2,14],15:[1,44],17:[2,14],18:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],24:[2,14],29:[2,14],31:[2,14],37:[2,14]},{5:[2,15],15:[1,44],17:[2,15],18:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],24:[2,15],29:[2,15],31:[2,15],37:[2,15]},{5:[2,16],15:[1,44],17:[2,16],18:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],24:[2,16],29:[2,16],31:[2,16],37:[2,16]},{5:[2,32],8:[2,32],10:[2,32],11:[2,32],13:[2,32],15:[2,32],17:[2,32],18:[2,32],19:[2,32],20:[2,32],22:[2,32],23:[2,32],24:[2,32],26:[2,32],29:[2,32],31:[2,32],33:[2,32],37:[2,32],40:[2,32],52:[2,32]},{5:[2,33],8:[2,33],10:[2,33],11:[2,33],13:[2,33],15:[2,33],17:[2,33],18:[2,33],19:[2,33],20:[2,33],22:[2,33],23:[2,33],24:[2,33],26:[2,33],29:[2,33],31:[2,33],33:[2,33],37:[2,33],40:[2,33],52:[2,33]},{5:[2,50],8:[2,50],10:[2,50],11:[2,50],13:[2,50],15:[2,50],17:[2,50],18:[2,50],19:[2,50],20:[2,50],22:[2,50],23:[2,50],24:[2,50],26:[2,50],29:[2,50],31:[2,50],33:[2,50],37:[2,50],52:[2,50]},{5:[2,11],8:[1,50],13:[1,49],15:[2,11],17:[2,11],18:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],24:[2,11],29:[2,11],31:[2,11],37:[2,11]},{5:[2,29],8:[2,29],10:[2,29],11:[2,29],13:[2,29],15:[2,29],17:[2,29],18:[2,29],19:[2,29],20:[2,29],22:[2,29],23:[2,29],24:[2,29],26:[2,29],29:[2,29],31:[2,29],33:[2,29],37:[2,29],40:[2,29],52:[2,29]},{33:[1,72],37:[1,77]},{5:[2,41],8:[2,41],10:[2,41],11:[2,41],13:[2,41],15:[2,41],17:[2,41],18:[2,41],19:[2,41],20:[2,41],22:[2,41],23:[2,41],24:[2,41],26:[2,41],29:[2,41],31:[2,41],33:[2,41],37:[2,41],52:[2,41]},{7:78,27:15,34:14,35:[1,24],36:[1,17],38:16,39:26,41:9,42:[1,19],43:10,44:[1,20],45:11,46:[1,21],47:12,48:[1,22],49:13,50:[1,23],51:[1,25]},{5:[2,8],8:[2,8],10:[1,51],11:[1,52],13:[2,8],15:[2,8],17:[2,8],18:[2,8],19:[2,8],20:[2,8],22:[2,8],23:[2,8],24:[2,8],29:[2,8],31:[2,8],37:[2,8]},{5:[2,9],8:[2,9],10:[1,51],11:[1,52],13:[2,9],15:[2,9],17:[2,9],18:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],24:[2,9],29:[2,9],31:[2,9],37:[2,9]},{5:[2,5],8:[2,5],10:[2,5],11:[2,5],13:[2,5],15:[2,5],17:[2,5],18:[2,5],19:[2,5],20:[2,5],22:[2,5],23:[2,5],24:[2,5],29:[2,5],31:[2,5],37:[2,5]},{5:[2,6],8:[2,6],10:[2,6],11:[2,6],13:[2,6],15:[2,6],17:[2,6],18:[2,6],19:[2,6],20:[2,6],22:[2,6],23:[2,6],24:[2,6],29:[2,6],31:[2,6],37:[2,6]},{5:[2,30],8:[2,30],10:[2,30],11:[2,30],13:[2,30],15:[2,30],17:[2,30],18:[2,30],19:[2,30],20:[2,30],22:[2,30],23:[2,30],24:[2,30],26:[2,30],29:[2,30],31:[2,30],33:[2,30],37:[2,30],40:[2,30],52:[2,30]},{33:[2,28],37:[2,28],52:[2,28]}],
defaultActions: {31:[2,1]},
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
less:function (n) {
        this._input = this.match.slice(n) + this._input;
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
case 0:return 26;
break;
case 1:/* skip whitespace */
break;
case 2:return 44;
break;
case 3:return 50;
break;
case 4:return 22;
break;
case 5:return 23;
break;
case 6:return 19;
break;
case 7:return 17;
break;
case 8:return 20;
break;
case 9:return 18;
break;
case 10:return 24;
break;
case 11:return 29;
break;
case 12:return 31;
break;
case 13:return 48;
break;
case 14:return 42;
break;
case 15:return 35;
break;
case 16:return 46;
break;
case 17:return 40;
break;
case 18:return 10;
break;
case 19:return 11;
break;
case 20:return 33;
break;
case 21:return 8;
break;
case 22:return 24;
break;
case 23:return 22;
break;
case 24:return 22;
break;
case 25:return 23;
break;
case 26:return 23;
break;
case 27:return 19;
break;
case 28:return 20;
break;
case 29:return 18;
break;
case 30:return 17;
break;
case 31:return 29;
break;
case 32:return 31;
break;
case 33:return 13;
break;
case 34:return 15;
break;
case 35:return 36;
break;
case 36:return 52;
break;
case 37:return 51;
break;
case 38:return 37;
break;
case 39:return 5;
break;
}
};
lexer.rules = [/^\s+in\b/,/^\s+/,/^[0-9]+(?:\.[0-9]+)?\b/,/^null\b/,/^(eq|EQ)/,/^(neq|NEQ)/,/^(lte|LTE)/,/^(lt|LT)/,/^(gte|GTE)/,/^(gt|GT)/,/^(like|LIKE)/,/^(and|AND)/,/^(or|OR)/,/^(true|false)/,/^'[^']*'/,/^[a-zA-Z0-9]+/,/^\/(.*)\//,/^\./,/^\*/,/^\//,/^,/,/^-/,/^=~/,/^==/,/^===/,/^!=/,/^!==/,/^<=/,/^>=/,/^>/,/^</,/^&&/,/^\|\|/,/^\+/,/^\^/,/^\(/,/^\]/,/^\[/,/^\)/,/^$/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],"inclusive":true}};
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