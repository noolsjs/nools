"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../");

it.describe("nools", function (it) {
    it.describe(".flow", function (it) {
        it.should("create a flow", function () {
            var flow = nools.flow("nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("nools flow", flow.name);
            assert.equal(nools.getFlow("nools flow"), flow);
        });
    });

    it.describe(".deleteFlow", function (it) {
        it.should("delete a flow by name", function () {
            var flow = nools.flow("delete nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("delete nools flow", flow.name);
            assert.equal(nools.getFlow("delete nools flow"), flow);

            assert.equal(nools.deleteFlow("delete nools flow"), nools);
            assert.isUndefined(nools.getFlow("delete nools flow"));

        });

        it.should("delete a flow using a Flow instance", function () {
            var flow = nools.flow("delete nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("delete nools flow", flow.name);
            assert.equal(nools.getFlow("delete nools flow"), flow);

            assert.equal(nools.deleteFlow(flow), nools);
            assert.isUndefined(nools.getFlow("delete nools flow"));

        });
    });

    it.describe(".hasFlow", function (it) {

        it.should("return true if the flow exists", function () {
            var name = "has flow";
            nools.flow(name);
            assert.isTrue(nools.hasFlow(name));
        });

        it.should("return false if the flow does not exists", function () {
            assert.isFalse(nools.hasFlow(new Date().toString()));
        });
    });

    it.describe(".deleteFlows", function (it) {

        it.should("deleteAllFlows", function () {
            var name = "delete nools flows";
            nools.flow(name);
            assert.isTrue(nools.hasFlow(name));
            assert.equal(nools.deleteFlows(), nools);
            assert.isFalse(nools.hasFlow(name));
        });

    });
});