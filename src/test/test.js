"use strict";
exports.__esModule = true;
var smartctl_1 = require("../smartctl/smartctl");
var sc = new smartctl_1.SmartCtl().init();
sc.then(function (s) {
    console.log(s);
});
