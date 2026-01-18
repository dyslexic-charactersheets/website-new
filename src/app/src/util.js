/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */


// identity functions
export function isNull(val) {
  return val === null || val === undefined;
}

export function isEmpty(val) {
  return val === null || val === undefined || val == "" || (Array.isArray(val) && val.length == 0);
}

export function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

export function isNumber(val) {
  return Number.isFinite(val);
}

export function isArray(val) {
  return Array.isArray(val);
}

export function isObject(val) {
  return val instanceof Object;
}

export function has(container, property) {
  if (isNull(container)) return false;
  return Object.prototype.hasOwnProperty.call(container, property) && !isNull(container[property]);
}
