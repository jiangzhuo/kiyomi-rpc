var test = require("test");
run("./util/proxy.js");
(function() {
    test.run();
}).start().join();