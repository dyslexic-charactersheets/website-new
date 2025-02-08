let signalsLogger = getDebug('signals');
// enableDebug('signals');

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
  if (command.match(/=/)) {
    // set a variable
    let [dest, value] = command.split('=');
    let [target, variable] = dest.trim().split('.');
    set(target.trim(), variable.trim(), value.trim());
  } else {
    // some other command
    let args = command.split(' ');
    let commandWord = args.shift();
    switch (commandWord) {
      case "emit":
        let signal = args.shift();
        emit(element, signal, args);
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

  // let the DOM catch up before we do the next command
  setTimeout(() => doCommands(commands, element), 5);
}


// dispatch a new event (or several, separated by a comma) on a target element
function emit(target, signal, args, event) {
  signalsLogger.log("Emit", target, signal, args);
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
    return;
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
    signalsLogger.log("  Emit: event", evt);
    target.dispatchEvent(evt);
  }
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
