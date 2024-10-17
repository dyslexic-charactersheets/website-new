export function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

export function isNumber(val) {
  return Number.isFinite(val);
}

export function isArray(val) {
    return Array.isArray(val);
}

export function isNull(val) {
    return val === null || val === undefined;
}

export function isObject(val) {
    return val instanceof Object;
}

export function isEmpty(obj) {
  return obj === undefined || obj === null || (isString(obj) && obj == "") || (isNumber(obj) && isNaN(obj));
}

export function has(obj, key) {
  // console.log("has", obj, key);
  return !isEmpty(obj) && Object.prototype.hasOwnProperty.call(obj, key) && !isEmpty(obj[key]);
}

export function slugify(str) {
  str = str.toLowerCase();
  str = str.replace("'", "");
  str = str.replace(/ \(.*\)/, '');
  str = str.split(/[ _/-]+/).join('-');
  return str;
}
