require([
    'nools',
    'banking/models/cash_flow',
    'banking/models/account',
    'text!banking/rules/banking.nools'
], function (nools, CashFlow, Account, rule1) {

    var flow = nools.compile(rule1, {name: "rule1", define: {Cashflow: CashFlow}});

    var Account1 = new Account({accountNo: 1}), Account2 = new Account({accountNo: 2});
    var session = flow.getSession(
        new CashFlow({amount: 300, date: new Date(2007, 0, 1), type: "credit", account: Account1}),
        new CashFlow({amount: 100, date: new Date(2007, 1, 5), type: "credit", account: Account1}),
        new CashFlow({amount: 500, date: new Date(2007, 2, 11), type: "credit", account: Account2}),
        new CashFlow({amount: 800, date: new Date(2007, 1, 7), type: "debit", account: Account1}),
        new CashFlow({amount: 400, date: new Date(2007, 2, 2), type: "debit", account: Account2}),
        new CashFlow({amount: 200, date: new Date(2007, 3, 1), type: "credit", account: Account1}),
        new CashFlow({amount: 300, date: new Date(2007, 3, 5), type: "credit", account: Account1}),
        new CashFlow({amount: 700, date: new Date(2007, 4, 11), type: "credit", account: Account2}),
        new CashFlow({amount: 900, date: new Date(2007, 4, 7), type: "debit", account: Account1}),
        new CashFlow({amount: 100, date: new Date(2007, 4, 2), type: "debit", account: Account2})
    );

    session.match(function (err) {
        if (err) {
            console.log(err.stack);
        }
    });

});