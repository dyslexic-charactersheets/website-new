
function bool(val) {
  if (val === true) return true;
  if (val === false) return false;
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === undefined || val === null) return false;
  if (val === "") return true;
  return true;
}

function toCamelCase(str) {
  let words = str.split('-');
  words = words.map(word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
  words[0] = words[0].toLowerCase();
  return words.join('');
}

function toKebabCase(str) {
  let words = str.split(/([A-Z][a-z]+)/);
  words = words.map(word => word.toLowerCase());
  words = words.filter(word => word != '');
  return words.join('-');
}

function isArray(val) {
  if (val === null || val === undefined) {
    return false;
  }
  return Array.isArray(val);
}

function isString(val) {
  if (val === null || val === undefined) {
    return false;
  }
  return typeof val === 'string' || val instanceof String;
}

function isElement(val) {
  if (val === null || val === undefined) {
    return false;
  }
  return (
    typeof HTMLElement === "object" ? val instanceof HTMLElement : //DOM2
    val && typeof val === "object" && val.nodeType === 1 && typeof val.nodeName === "string"
  );
}
