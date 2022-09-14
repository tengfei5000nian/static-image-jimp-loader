"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.raw = void 0;

var _schemaUtils = _interopRequireDefault(require("schema-utils"));

var _jimp = _interopRequireDefault(require("jimp"));

var _options = _interopRequireDefault(require("./options.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const max = /^m(w|h)(\d+)$/;
const align = /(\,?(left|center|right|top|middle|bottom))+/;
const methods = ['resize', 'contain', 'cover', 'flip', 'rotate', 'scale', 'scaleToFit', 'color'];
const colorMethods = ['lighten', 'brighten', 'darken', 'desaturate', 'saturate', 'greyscale', 'spin', 'hue', 'mix', 'tint', 'shade', 'xor', 'red', 'green', 'blue'];

function extend(...configs) {
  const target = {};
  [...methods, 'special', 'merge', 'methods'].forEach(method => {
    const config = configs.reduce((t, c) => {
      if (t == null) {
        return c[method];
      } else if (method === 'methods') {
        return [...new Set([...t, ...c[method]])];
      } else if (Array.isArray(t)) {
        return t.length || !Array.isArray(c[method]) ? t : c[method];
      } else if (typeof t !== 'undefined') {
        return t;
      }
    }, null);
    if (config != null) target[method] = config;
  });
  return target;
}

function validateQuery(query) {
  const _query = extend(query, {
    contain: [],
    cover: [],
    flip: [],
    resize: [],
    rotate: [],
    scale: [],
    scaleToFit: [],
    color: [],
    special: new Map(),
    merge: true,
    methods
  });

  _schemaUtils.default.validate(_options.default, _query);

  _query.special.forEach((value, key) => {
    _query.special.set(key, validateQuery(value));
  });

  return _query;
}

function resourceQuery(resource) {
  var _resource$match;

  const useMethods = [];
  const items = ((_resource$match = resource.match(/[?&]\w+\=[^&]+/g)) === null || _resource$match === void 0 ? void 0 : _resource$match.map(value => {
    const matchs = value.match(/(\w+)\=([^&]+)/);
    if (methods.includes(matchs[1])) useMethods.push(matchs[1]);
    return {
      [matchs[1]]: matchs[2].replace('auto', _jimp.default.AUTO).replace('nearest', _jimp.default.RESIZE_NEAREST_NEIGHBOR).replace('bilinear', _jimp.default.RESIZE_BILINEAR).replace('bicubic', _jimp.default.RESIZE_BICUBIC).replace('hermite', _jimp.default.RESIZE_HERMITE).replace('bezier', _jimp.default.RESIZE_BEZIER).replace(align, e => {
        const v = e.split(',').map(v => {
          switch (v) {
            case 'left':
              return _jimp.default.HORIZONTAL_ALIGN_LEFT;

            case 'center':
              return _jimp.default.HORIZONTAL_ALIGN_CENTER;

            case 'right':
              return _jimp.default.HORIZONTAL_ALIGN_RIGHT;

            case 'top':
              return _jimp.default.VERTICAL_ALIGN_TOP;

            case 'middle':
              return _jimp.default.VERTICAL_ALIGN_MIDDLE;

            case 'bottom':
              return _jimp.default.VERTICAL_ALIGN_BOTTOM;

            default:
              return null;
          }
        }).reduce((t, a) => {
          if (t == null) {
            return a;
          } else if (a == null) {
            return t;
          } else {
            return t | a;
          }
        }, null);
        return v == null ? '' : `,${v}`;
      })
    };
  })) || [];
  const query = items.reduce((target, value) => Object.assign(target, value), {});

  for (const key in query) {
    let value = query[key];

    if (/true|false/.test(value)) {
      value = value === 'true';
    } else {
      value = value.split(',').map(v => {
        if (/^\-?\d+$/.test(v)) {
          return parseFloat(v);
        } else if (/true|false/.test(v)) {
          return v === 'true';
        } else {
          return v;
        }
      });
      const colorValue = [];
      let colorValueItem = null;
      value.forEach(v => {
        if (colorMethods.includes(v)) {
          colorValueItem && colorValue.push(colorValueItem);
          colorValueItem = {
            apply: v,
            params: []
          };
        } else if (colorValueItem) {
          colorValueItem.params.push(v);
        }
      });
      colorValueItem && colorValue.push(colorValueItem);
      if (colorValue.length) value = colorValue;
    }

    query[key] = value;
  }

  query.methods = [...new Set([...(query.methods || []), ...useMethods])];
  return query;
}

function moduleQuery(query, resource) {
  const urlQuery = validateQuery(resourceQuery(resource));
  if (!urlQuery.merge) return urlQuery;
  const globalQuery = validateQuery(query);
  let specialQuery = validateQuery({});
  globalQuery.special.forEach((value, key) => {
    if (key instanceof RegExp && key.test(resource) || typeof key === 'string' && ~resource.indexOf(key)) {
      if (value.merge) {
        specialQuery = extend(value, specialQuery);
      } else {
        specialQuery = value;
      }
    }
  });
  if (!specialQuery.merge) return extend(urlQuery, specialQuery);
  return extend(urlQuery, specialQuery, globalQuery);
}

const raw = true;
exports.raw = raw;

async function _default(content, map, meta) {
  const callback = this.async();

  try {
    const query = moduleQuery(this.query, this.resource);
    const image = await _jimp.default.create(content);
    query.methods.forEach(method => {
      if (!methods.includes(method)) return;
      if (!query[method].length) return;
      const args = query[method].map(v => {
        if (max.test(v)) {
          const match = max.exec(v);
          const maxValue = parseFloat(match[2]);
          const maxType = match[1] === 'w' ? 'Width' : match[1] === 'h' ? 'Height' : '';
          if (!maxType) return maxValue;
          const actualValue = image[`get${maxType}`]();
          return Math.min(maxValue, actualValue);
        } else {
          return v;
        }
      });

      if (method === 'color') {
        image[method](args);
      } else {
        image[method](...args);
      }
    });
    const mime = image.getMIME();
    const data = await image.getBufferAsync(mime);
    callback(null, data, map, meta);
  } catch (err) {
    callback(err, '', map, meta);
  }
}
//# sourceMappingURL=index.js.map