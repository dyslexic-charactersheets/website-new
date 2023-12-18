function isString(val) {
  return typeof val === 'string' || val instanceof String;
}



/// EVENTS

// run the handler on all elements matching a query
function all(query, handler) {
  for (let elem of document.querySelectorAll(query)) {
    handler.call(null, elem);
  }
}

// handle an event on a target (by query selector, array or single element)
function on(target, signal, handler) {
  if (isString(target)) {
    for (let elem of document.querySelectorAll(target)) {
      ((elem) => {
        elem.addEventListener(signal, (evt) => {
          evt.stopPropagation();
          handler.call(null, evt, elem);
        });
      })(elem);
    }
  } else if (Array.isArray(target)) {
    for (let elem of target) {
      ((elem) => {
        elem.addEventListener(signal, (evt) => {
          evt.stopPropagation();
          handler.call(null, evt, elem);
        });
      })(elem);
    }
  } else {
    target.addEventListener(signal, (evt) => {
      evt.stopPropagation();
      handler.call(null, evt, target);
    });
  }
}

// set an element's attribute
function set(target, variable, value) {
  all(target, (elem) => {
    elem.dataset[variable] = value;
  });
}

// watch an element's attribute for changes
function watch(target, attribute, handler) {
  let observer = new MutationObserver(function (mutations) {
    for (let mutation of mutations) {
      if (mutation.type == 'attributes' && mutation.attributeName == attribute) {
        handler.call();
      }
    }
  });
  observer.observe(target, {attributes: true});
}

function lookup(desc) {
  let [target, attribute] = desc.split('.');
  document.querySelector('[data-')
}


/// REACTIVE

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

class ElementObserver {
  constructor(element) {
    this.bindings = {};
    let self = this;

    let mutationObserver = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type == 'attributes') {
          let name = toCamelCase(mutation.attributeName.replace(/^data-/, ''));
          if (name in self.bindings) {
            let bindings = self.bindings[name];
            let value = element.dataset[name];

            console.log("Binding value", value);
            for (let binding of bindings) {
              binding(value);
            }
          }
        }
      }
    });
    mutationObserver.observe(element, {attributes: true});
  }

  addBinding(attribute, callback) {
    if (!(attribute in this.bindings)) {
      this.bindings[attribute] = [];
    }
    this.bindings[attribute].push(callback);
  }
}

function initObserver(target) {
  if (isString(target)) {
    for (let elem of document.querySelectorAll(target)) {
      if (!('observer' in elem)) {
        elem.observer = new ElementObserver(elem);
      }
      return elem;
    }
  } else if (Array.isArray(target)) {
    for (let elem of target) {
      if (!('observer' in elem)) {
        elem.observer = new ElementObserver(elem);
      }
      return elem;
    }
  } else {
    if (!('observer' in target)) {
      target.observer = new ElementObserver(target);
    }
    return target;
  }
}

let pipeFunctions = {};
function definePipe(name, bindfn) {
  pipeFunctions[name] = bindfn;
}
definePipe('isSet', (value) => value !== undefined && value !== null && value != "");
definePipe('eq', (value, cond) => true && (value == cond));
definePipe('default', (value, defaultValue) => {
  if (value !== undefined && value !== null && value != "") {
    return value;
  }
  return defaultValue;
})


// SETUP
function setupBindings(container) {
  let bindings = [];

  // find all the bindings;
  for (let destElem of container.querySelectorAll('*[data-bind]')) {
    for (let bind of destElem.dataset.bind.split(';')) {
      let [field, rvalue] = bind.split('=', 2);
      field = field.trim();
      rvalue = rvalue.trim();
      let lvalue = field;
      if (destElem.id !== undefined && destElem !== null && destElem != "") {
        lvalue = "#"+destElem.id+"."+field;
      }
      console.log(" * Binding:", lvalue, "to", rvalue);
          
      let pipes = rvalue.split('|').map((s) => s.trim());
      let source = pipes.shift();

      // find the data source element
      let [sourceSelector, sourceAttr] = source.split('.');
      let sourceElem = initObserver(sourceSelector);
      if (sourceElem === undefined || sourceElem === null) {
        console.log("   * Source element not found:", sourceSelector);
        continue;
      }

      let bindingFunction = createBinding(destElem, field, pipes);

      sourceElem.observer.addBinding(sourceAttr, bindingFunction);

      // TODO start off with the right value
    }

    // 1. calculate initial values
    for (let binding of bindings) {

    }

    // 2. attach listeners

    // 3. calculate values again
  }
}

function createBinding(destElem, field, pipes) {
  return function (value) {
    console.log(" * Binding callback");

    console.log("   * Bind processing value of", field, value, pipes);
    for (let pipe of pipes) {
      let pipeArgs = pipe.split(' ').map((s) => s.trim());
      let pipeCommand = pipeArgs.shift();
      pipeArgs = pipeArgs.map((s) => s.replace(/'(.*)'/, '$1'));
      if (pipeFunctions.hasOwnProperty(pipeCommand)) {
        value = pipeFunctions[pipeCommand](value, ...pipeArgs);
      }
    }

    // actually set the value
    console.log("   * Bind setting value of", field, value, pipes);
    switch (field) {
      case 'content':
        destElem.innerHTML = value;
        break;

      case 'class':
        destElem.setAttribute(field, value);
        break;

      default:
        destElem.dataset[field] = value;
    }
  }
}

// SETUP

window.addEventListener('load', () => {
  setupBindings(body);
});


on('*[data-on-click]', 'click', (evt, element) => {
  if (element.dataset.onClick) {
    let commands = element.dataset.onClick.split(';');
    doCommands(commands, element);
  }
});
