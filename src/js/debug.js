let debugSettings = {};

function getDebug(zone) {
  let indentlevel = 0;

  function pad(str) {
    let minwidth = 16 + indentlevel * 4;
    return str.padEnd(minwidth);
  }

  function prefix(message) {
    return pad('%c['+zone+'] ')+message;
  }

  function log(message, ...args) {
    if (debugSettings[zone]) {
      console.log(prefix(message), 'color: cyan', ...args);
    }
  }
  
  function warn(message, ...args) {
    if (debugSettings[zone]) {
      console.log(prefix(message), 'color: orange', ...args);
    }
  }

  function error(message, ...args) {
    console.log(prefix(message), 'color: red', ...args);
  }

  function indent() {
    indentlevel++;
  }

  function outdent() {
    indentlevel--;
    if (indentlevel < 0) {
      indentlevel = 0;
    }
  }

  return {
    log, warn, error, indent, outdent
  }
}

function enableDebug(zone) {
  debugSettings[zone] = true;
}
