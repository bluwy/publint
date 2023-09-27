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

// Example minified content:
// !function(t,i){"object"==typeof exports&&"undefined"!=typeof module?i(exports):"function"==typeof define&&define.amd?define(["exports"],i):i((t=t||self).lil={})}(this,(function(t){"use strict";
