export function slugify(str) {
    str = str.replace(/_\{(.*?)\}/, '$1');
    str = str.replace('\'', '');
    str = str.replace(/[^A-Za-z0-9]+/g, '-');
    str = str.replace(/^-+/, '');
    str = str.replace(/-+$/, '');
    str = str.toLowerCase();
    return str;
}

export function stringify(obj) {
  let cache = [];
  let str = JSON.stringify(obj, function(key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  }, 2);
  cache = null; // reset the cache
  return str;
}

export function has(container, property) {
  if (isNull(container)) return false;
  return Object.prototype.hasOwnProperty.call(container, property) && !isNull(container[property]);
}

export function isNull(val) {
  return val === null || val === undefined;
}

export function isFunction(val) {
  return val !== null && (typeof val === 'function' || val instanceof Function);
}

export function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

export function isArray(val) {
  return Array.isArray(val);
}

export function isObject(val) {
  return val instanceof Object;
}

// LOGGING
import colors from 'colors';

export function log(area, message, ...args) {
  const prefix = `[${area}] `.padEnd(16).cyan;
  console.log(`${prefix}${message}`, ...args);
}

export function warn(area, message, ...args) {
  const prefix = `[${area}] `.padEnd(16).yellow;
  console.log(`${prefix}${message}`, ...args);
}

export function error(area, message, ...args) {
  const prefix = `[${area}] `.padEnd(16).red.bold;
  console.log(`${prefix}${message}`, ...args);
}
