//var lib = process.env.POMELO_RPC_COV ? 'lib-cov' : 'lib';
//var should = require('should');
"use strict";
var test = require("test");
test.setup();
var Proxy = require('../../lib/util/proxy');

assert.instanceOf = function (obj, type) {
    assert.ok(Object(obj) instanceof type);
};

var A = function (value) {
    this.value = value;
};
A.prototype.add = function (num) {
    this.value += num;
};
A.prototype.sub = function (num) {
    this.value -= num;
};
A.prototype.addB = function () {
    this.b.value++;
};
A.prototype.addInternal = function () {
    this.add(1);
};

var B = function (value) {
    this.value = value;
};
B.prototype.addA = function () {
    this.a.value++;
};

var callback = function (service, method, args, attach, invoke) {

};

describe('proxy', function () {
    describe('#create', function () {
        it('should invoke the proxy function if it had been set', function () {
            var callbackCount = 0;
            var cb = function (service, method, args, attach, invoke) {
                callbackCount++;
            };
            var a = new A(1);

            var proxy = Proxy.create({
                service: 'A',
                origin: a,
                proxyCB: cb
            });
            proxy.add(1);
            assert.equal(callbackCount, 1);
        });

        it('should invoke the origin function if the proxy function not set', function () {
            var value = 1;
            var a = new A(value);

            var proxy = Proxy.create({
                origin: a
            });
            proxy.add(1);
            assert.equal(a.value, value + 1);
        });
        //
        it('should invoke the origin function if the invoke callback had been called in proxy function', function () {
            var callbackCount = 0;
            var originCallCount = 0;
            var value = 1;

            var a = new A(value);
            a.add = function (num) {
                originCallCount++;
                this.value += num;
            };

            var cb = function (namespace, method, args, attach, invoke) {
                callbackCount++;
                a[method].apply(a, args);
            };

            //overwrite the origin function
            var proxy = Proxy.create({
                origin: a,
                proxyCB: cb
            });
            proxy.add(1);

            assert.equal(callbackCount, 1);
            assert.equal(originCallCount, 1);
            assert.equal(a.value, value + 1);
        });

        it('should not invoke the origin function if the invoke callback not called', function () {
            var callbackCount = 0;
            var originCallCount = 0;
            var value = 1;

            var cb = function (namespace, method, args, attach, invoke) {
                callbackCount++;
            };
            var a = new A(value);
            //overwrite the origin function
            a.add = function (num) {
                originCallCount++;
                this.value += this.value;
            };

            var proxy = Proxy.create({
                origin: a,
                proxyCB: cb
            });
            proxy.add(1);

            assert.equal(callbackCount, 1);
            assert.equal(originCallCount, 0);
            assert.equal(a.value, value);
        });

        it('should flush the operation result on fields to the origin object', function () {
            var value = 1;

            var a = new A(value);
            var proxy = Proxy.create({
                origin: a
            });

            proxy.value++;

            assert.equal(proxy.value, value + 1);
            assert.equal(a.value, value + 1);
        });

        it('should be ok if create proxies for two objects that references each other', function () {
            var callbackCount = 0;
            var valueA = 1;
            var valueB = 2;

            var a = new A(valueA);
            var b = new B(valueB);

            var cbA = function (namespace, method, args, attach, invoke) {
                callbackCount++;
                a[method].apply(a, args);
            };
            var cbB = function (namespace, method, args, attach, invoke) {
                callbackCount++;
                b[method].apply(b, args);
            };

            var proxyA = Proxy.create({
                origin: a,
                proxyCB: cbA
            });
            var proxyB = Proxy.create({
                origin: b,
                proxyCB: cbB
            });
            a.b = b;
            b.a = a;
            proxyA.addB();
            proxyB.addA();

            assert.equal(callbackCount, 2);
            assert.equal(a.value, valueA + 1);
            assert.equal(b.value, valueB + 1);
        });

        it('should not proxy the internal invoking', function () {
            var callbackCount = 0;
            var value = 1;

            var cb = function (namespace, method, args, attach, invoke) {
                callbackCount++;
                a[method].apply(a, args);
            };
            var a = new A(value);

            var proxy = Proxy.create({
                origin: a,
                proxyCB: cb
            });
            proxy.addInternal(1);

            assert.equal(callbackCount, 1);
            assert.equal(a.value, value + 1);
        });

        it('should has the same class info with origin object', function () {
            var a = new A(1);

            var proxy = Proxy.create({
                origin: a
            });

            assert.instanceOf(proxy,A);
        });

        it('should pass the attach from opts to invoke callback', function () {
            var callbackCount = 0;
            var expectAttach = {someValue: 1, someObject: {}, someStr: "hello"};

            var cb = function (namespace, method, args, attach, invoke) {
                callbackCount++;
                assert.exist(attach);
                assert.equal(attach, expectAttach);
            };
            var a = new A(1);

            var proxy = Proxy.create({
                origin: a,
                proxyCB: cb,
                attach: expectAttach
            });
            proxy.addInternal(1);
            assert.equal(callbackCount, 1);
        });
    });
});