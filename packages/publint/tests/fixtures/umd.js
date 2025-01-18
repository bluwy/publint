export default {
  'package.json': JSON.stringify({
    name: 'publint-umd',
    version: '0.0.1',
    private: true,
    type: 'module',
    main: './main.umd.js',
  }),
  'main.umd.js': `
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
  `,
}
