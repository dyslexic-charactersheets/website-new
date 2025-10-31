/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

let signalsLogger = getDebug('signals');
enableDebug('signals');

let commandFunctions = {};

function defineCommand(command, func) {
  commandFunctions[command] = func;
}

function doCommands(commands, element) {
  if (commands === undefined || commands === null || commands.length == 0) {
    return;
  }

  // do the command
  let command = commands.shift().trim();
  signalsLogger.log("Command:", command);
  signalsLogger.indent();
  if (command.match(/=/)) {
    // set a variable
    let [dest, value] = command.split('=');
    let [target, variable] = dest.trim().split('.');
    set(target.trim(), variable.trim(), value.trim());
  } else {
    // some other command
    let args = command.split(/ +/);
    let commandWord = args.shift();
    switch (commandWord) {
      case "emit":
        let target = element;
        if (args[0].startsWith('#')) {
          let targetid = args.shift();
          target = document.querySelector(targetid);
        }
        let signal = args.shift();
        emit(target, signal, args);
        break;
      case "show-menu":
        let menu = args.shift();
        set('body', 'currentMenu', menu);
        break;
      default:
        if (commandFunctions.hasOwnProperty(command)) {
          commandFunctions[command]();
        }
        signalsLogger.warn("Unknown command:", command);
        break;
    }
  }
  signalsLogger.outdent();

  // let the DOM catch up before we do the next command
  setTimeout(() => doCommands(commands, element), 5);
}


// dispatch a new event (or several, separated by a comma) on a target element
function emit(target, signal, args, event) {
  signalsLogger.log("Emit", target, signal, args);
  signalsLogger.indent();
  if (args !== null && args instanceof Event) {
    event = args;
    args = {};
  }
  if (args === null || args === undefined) {
    args = {};
  }

  if (isString(target)) {
    target = document.querySelector(target);
  }
  if (target === null) {
    signalsLogger.warn("Emit: target null");
    signalsLogger.outdent();
    return;
  }

  if (isString(args)) {
    if (args.startsWith("'") && args.endsWith("'")) {
      args = args.substring(1, args.length - 1);
    }
  } else if (Array.isArray(args)) {
    for (let i in args) {
      let arg = args[i];
      if (isString(arg)) {
        if (arg.startsWith("'") && arg.endsWith("'")) {
          arg = arg.substring(1, arg.length - 1);
          args[i] = arg;
        }
      }
    }
  }

  let signals = signal.split(',');
  for (let sgn of signals) {
    let evt = new CustomEvent(sgn, {
      ...event,
      view: window,
      bubbles: true,
      cancelable: true,
      detail: args
    });
    signalsLogger.log("Emit: event", evt);
    target.dispatchEvent(evt);
  }
  signalsLogger.outdent();
}

let windowLoaded = false;
window.addEventListener('load', () => {
  windowLoaded = true;
});
function onloaded(fn) {
  if (windowLoaded) {
    setTimeout(fn, 1);
  } else {
    window.addEventListener('load', fn);
  }
}


/// SETUP

function setupSignals(container) {
  for (let element of container.querySelectorAll('*[data-on-click]')) {
    ((element) => {
      element.addEventListener('click', (evt) => {
        let commands = element.dataset.onClick.split(';');
        doCommands(commands, element);
      });
    })(element);
  }

  for (let element of container.querySelectorAll('*[data-on-change]')) {
    ((element) => {
      element.addEventListener('change', (evt) => {
        let commands = element.dataset.onChange.split(';');
        doCommands(commands, element);
      })
    })(element);
  }
}

window.addEventListener('load', () => {
  setupSignals(body);
});
