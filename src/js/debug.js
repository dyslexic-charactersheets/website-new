let debugSettings = {};

function getDebug(zone) {
  function log(message, ...args) {
    if (debugSettings[zone]) {
      console.log('%c['+zone+'] '+message, 'color: cyan', ...args);
    }
  }
  
  function warn(message, ...args) {
    if (debugSettings[zone]) {
      console.log('%c['+zone+'] '+message, 'color: orange', ...args);
    }
  }

  function error(message, ...args) {
    if (debugSettings[zone]) {
      console.log('%c['+zone+'] '+message, 'color: red', ...args);
    }
  }

  return {
    log, warn, error
  }
}

function enableDebug(zone) {
  debugSettings[zone] = true;
}
