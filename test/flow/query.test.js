"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("query", function (it) {

	var Message = function (message) {
		this.text = message;
		this.length = this.text ? this.text.length : 0;
	};

 it.describe("basic test of query", function (it) {

	var options = {
			arguments: {
				maxLen: Number
				,filter: RegExp
			}
			,scope: {
				Message: Message
			}
		};
		//
		var rule1Called = 0;
		var flow = nools.flow("query test 1",function (flow) {
			//
			flow.query('MsgFilter', options, [
				[Message, 'm', "m.text.length < maxLen && m.text =~ filter"]
			]);
			//
			flow.rule('test', [
				[Number, '$maxLen'],
				[RegExp, '$filter'],
				[Array,   'list', 'from MsgFilter($maxLen, $filter)']
			],function(facts) {
				rule1Called++;
			});
		});
		//
		it.should("rhs for rule calling query called a single time and list avaialable in lhs", function () {
			var session		= flow.getSession();
			//
			session.assert( new Message('hello world'));
			session.assert( 14 );
			session.assert( new RegExp(/world/i));
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
		//
		it.should("query can be called manually from session", function () {
			rule1Called = 0;
			//
			session.assert( new Message('hello world'));
			session.assert( 14 );
			session.assert( new RegExp(/world/i));
			//
			// call the query manually
			var list = session.getQuery('MsgFilter')(maxLen, /hello/i);
			assert.equal(list.length, 1);
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});		
	});

	it.describe("basic test of query using DSL", function (it) {
		//
		var rule1Called = 0;
		var flow = nools.compile(__dirname + '/query.nools', { name: 'TestQuery', define: {Message: Message} } );
		//
		it.should("rhs for rule calling query called a single time and list avaialable in lhs", function () {
			var session		= flow.getSession();
			//
			session.on("query-rule", function (list) {
				rule1Called++;
                assert.equal(list.length, 1);
				var msg = list[0];
				assert.equal(msg.text, 'hello world');
            });
			//
			session.assert( new Message('hello world'));
			session.assert( 14 );
			session.assert( new RegExp(/world/i));
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
	});

});
