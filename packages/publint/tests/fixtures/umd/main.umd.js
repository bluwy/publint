// prettier-ignore
;(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.umdPkgName = {}));
}(this, (function (exports) { 'use strict';

exports.foo = 'bar'
exports.default = 'default';

Object.defineProperty(exports, '__esModule', { value: true });

})));
