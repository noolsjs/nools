"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

//
function Customer(name) {
	this.name = name;
	this.items = [];
}
Customer.prototype = {
		add: function(order) {
			this.items.push(order);
		}
		,getOrder: function(name) {      
				var item;
				this.items.some(function(order) { if( order.type === name )  {item = order; return true;} });
				return item;
		}
}
//
function Item(type, price) {
	this.type = type;
	this.price = price;
}

it.describe("collect condition", function (it) {

    it.describe("basic test of collection element", function (it) {

		//
		var rule1Called = 0;
		var rule2Called = 0;
		var flow = nools.flow("collect test 1",function (flow) {
			flow.addDefined('Customer', Customer);
			flow.addDefined('Item', Item);
			flow.rule("rule 1" , {salience: 10,  scope: { Customer: Customer, Item: Item }}, [
				[Customer, 'c']
				,[Array, 'list', 'list.size === c.items.size', 'from collect( item : Item item.price > 10 from c.items )']
			], function(facts) {
				rule1Called++;
			});
		});
		//
		it.should("rhs for collection called a single time and set avaialable in lhs", function () {
			var session		= flow.getSession();
			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		11);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
		
		//
		var flow = nools.flow("collect test 2",function (flow) {
			flow.addDefined('Customer', Customer);
			flow.addDefined('Item', Item);
			flow.rule("rule 1" , {salience: 10,  scope: { Customer: Customer, Item: Item }}, [
				[Customer, 'c']
				,[Array, 'list', 'list.size === c.items.size', 'from collect( item : Item item.price > 10 from c.items)']
			], function(facts) {
				rule1Called++;
			});
			flow.rule("rule 2", {salience: 5,  noLoop: true, scope: { Customer: Customer, Item: Item }}, [
				[Item, 'item', "item.type == 'bike' && item.price !== 11"]
			], function (facts) {
				rule2Called++;
				facts.item.price = 11;
				this.modify(facts.item);
			});
		});
		//
		it.should("use set in from expression with modified fact causing rhs to fire once", function () {
			var session		= flow.getSession();
			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		9);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			rule1Called = rule2Called = 0;
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(rule2Called, 1);
			});
		});
		
	});

	it.describe("basic test of collect using DSL", function (it) {
debugger;
		var defines = { Customer: Customer, Item: Item },
			flow = nools.compile(__dirname + '/collect.nools', { name: 'TestCollect', defines: defines} ),
			rule1Called = 0;

		//
		it.should("rhs for collection called a single time and set avaialable in lhs", function () {
			var session		= flow.getSession();
			//
			session.on("test-collect", function (customer, items) {
				rule1Called++;
			});

			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		11);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
	});
});
