(function(){
     function _getCompiled(nools){
        return (function(){return function(options){options = options || {};var bind = function(scope, fn){return function(){return fn.apply(scope, arguments);};}, defined = options.defined || {}, scope = options.scope || {};return nools.flow('orRule-notConditions-compiled', function(){var Count = defined.Count = this.addDefined('Count', (function(){var Defined = function (){         this.called = 0;     };var proto = Defined.prototype;proto.constructor = function (){         this.called = 0;     };return Defined;}()));scope.console = console;
this.rule('MultiNotOrRule',{"scope":scope}, [["or",["not", Number, "n1","n1 == 1"],["not", String, "s1","s1 == 'hello'"],["not", Date, "d1","d1.getDate() == now().getDate()"]],[Count, "c"]],function(facts,flow){with(flow){var c= facts.c;c.called++;     }});});};}());
     }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = _getCompiled(require("../../"));
        }
    } else if ("function" === typeof define && define.amd) {
        define(["../../"], function (nools) {
            return _getCompiled(nools);
        });
    } else {
        _getCompiled(this.nools)();
    }

}).call(this);
