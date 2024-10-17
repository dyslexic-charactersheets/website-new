function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

function isElement(val) {
  return (
    typeof HTMLElement === "object" ? val instanceof HTMLElement : //DOM2
    val && typeof val === "object" && val !== null && val.nodeType === 1 && typeof val.nodeName==="string"
  );
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
      ((elem, signal) => {
        elem.addEventListener(signal, (evt) => {
          evt.stopPropagation();
          handler.call(null, evt, elem);
        });
      })(elem, signal);
    }
  } else if (Array.isArray(target)) {
    for (let elem of target) {
      ((elem, signal) => {
        elem.addEventListener(signal, (evt) => {
          evt.stopPropagation();
          handler.call(null, evt, elem);
        });
      })(elem, signal);
    }
  } else if (isElement(target)) {
    target.addEventListener(signal, (evt) => {
      evt.stopPropagation();
      handler.call(null, evt, target);
    });
  }
}

// set an element's attribute
function set(target, field, value) {
  if (isElement(target)) {
    if (value === false || value === undefined) {
      switch (field) {
        case 'checked':
        case 'disabled':
          target[field] = false;
          break;
        default:
          delete target.dataset[field];
      }

    } else {
      switch (field) {
        case 'content':
          if (target.innerHTML == value) {
            return;
          }
          target.innerHTML = value;
          break;

        case 'value':
          if (target.getAttribute(field) == value) {
            return;
          }
          target.setAttribute(field, value);
          emit(target, 'change');
          break;

        case 'checked':
        case 'disabled':
          let checked = bool(value);
          let existing = bool(target.getAttribute(field))
          if (existing == checked) {
            return;
          }
          target.toggleAttribute(field, checked);
          if (field == 'checked') {
            emit(target, 'change');
          }
          break;

        case 'class':
          if (target.getAttribute(field) == value) {
            return;
          }
          target.setAttribute(field, value);
          break;

        default:
          if (target.dataset[field] == value) {
            return;
          }
          target.dataset[field] = value;
      }
      // target.dataset[field] = value;
    }
  } else {
    all(target, (elem) => {
      set(elem, field, value);
    });
  }
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


function getValue(sourceElem, sourceAttr) {
  switch (sourceAttr) {
    case 'content':
      return sourceElem.innerHTML;
    default:
      return sourceElem.dataset[sourceAttr];
  }
}


/// REACTIVE

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

class ElementObserver {
  constructor(element) {
    let id = (element.hasOwnProperty("id") && element.id !== undefined && element.id !== null && element.id != "") ? "#"+element.id : element.tagName;

    this.bindings = {};
    let self = this;

    let mutationObserver = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type == 'attributes') {
          let name = toCamelCase(mutation.attributeName.replace(/^data-/, ''));
          if (name in self.bindings) {
            let bindings = self.bindings[name];
            let value = element.dataset[name];

            console.log("Observed value", id+"."+name, "=", value, "-- sending to", Object.keys(bindings).length, "observers");
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
definePipe('not', (value) => {
  value = bool(value);
  return !value;
});
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

  // find all the bindings
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

      // sourceElem.observer.addBinding(sourceAttr, bindingFunction);
      bindings.push([sourceElem, sourceAttr, bindingFunction]);
    }

    // 1. calculate initial values
    for (let binding of bindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      let value = getValue(sourceElem, sourceAttr);
      bindingFunction(value);
    }

    // 2. attach listeners
    for (let binding of bindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      sourceElem.observer.addBinding(sourceAttr, bindingFunction);
    }

    // 3. calculate values again, knowing it'll reflow any changes
    for (let binding of bindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      let value = getValue(sourceElem, sourceAttr);
      bindingFunction(value);
    }
  }
}

function createBinding(destElem, field, pipes) {
  return function (value) {
    // console.log(" * Binding callback");

    // console.log("   * Bind processing value of", field, value, pipes);
    for (let pipe of pipes) {
      let pipeArgs = pipe.split(' ').map((s) => s.trim());
      let pipeCommand = pipeArgs.shift();
      pipeArgs = pipeArgs.map((s) => s.replace(/'(.*)'/, '$1'));
      if (pipeFunctions.hasOwnProperty(pipeCommand)) {
        value = pipeFunctions[pipeCommand](value, ...pipeArgs);
      }
    }

    // actually set the value
    // console.log("   * Bind setting value of", field, value, pipes);
    set(destElem, field, value);
    // switch (field) {
    //   case 'content':
    //     if (destElem.innerHTML == value) {
    //       return;
    //     }
    //     destElem.innerHTML = value;
    //     break;

    //   case 'value':
    //     if (destElem.getAttribute(field) == value) {
    //       return;
    //     }
    //     destElem.setAttribute(field, value);
    //     emit(destElem, 'change');
    //     break;

    //   case 'checked':
    //   case 'disabled':
    //     let checked = bool(value);
    //     let existing = bool(destElem.getAttribute(field))
    //     if (existing == checked) {
    //       return;
    //     }
    //     destElem.toggleAttribute(field, checked);
    //     if (field == 'checked') {
    //       emit(destElem, 'change');
    //     }
    //     break;

    //   case 'class':
    //     if (destElem.getAttribute(field) == value) {
    //       return;
    //     }
    //     destElem.setAttribute(field, value);
    //     break;

    //   default:
    //     if (destElem.dataset[field] == value) {
    //       return;
    //     }
    //     destElem.dataset[field] = value;
    // }
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
