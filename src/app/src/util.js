
// identity functions
function isNull(val) {
  return val === null || val === undefined;
}

function isEmpty(val) {
  return val === null || val === undefined || val == "" || (Array.isArray(val) && val.length == 0);
}

function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

function isNumber(val) {
  return Number.isFinite(val);
}

function isArray(val) {
  return Array.isArray(val);
}

function isObject(val) {
  return val instanceof Object;
}

function has(container, property) {
  if (isNull(container)) return false;
  return Object.prototype.hasOwnProperty.call(container, property) && !isNull(container[property]);
}

module.exports = {
  has,
  isNull,
  isEmpty,
  isString,
  isNumber,
  isArray,
  isObject
};
