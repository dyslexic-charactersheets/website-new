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

// Pipe functions

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
});


// Translated names

let pageData = {
  names: []
};
function readTextFile(file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4 && rawFile.status == "200") {
          callback(rawFile.responseText);
      }
  }
  rawFile.send(null);
}

readTextFile("data.json", function(text){
  pageData = JSON.parse(text);
});

definePipe('displayName', (id, selectKey) => {
  if (id === null || id === undefined || id === "") {
    return "";
  }
  if (pageData.names.hasOwnProperty(selectKey) && pageData.names[selectKey].hasOwnProperty(id)) {
    return pageData.names[selectKey][id];
  }
  componentLogger.warn("Unknown unit translation:", selectKey, id);
  return "";
});

// Pipes

function applyPipes(value, pipes) {
  if (pipes.length >= 2 && pipes[0] == "each" && value !== undefined && value !== null) {
    pipes = pipes.slice(1);
    if (isString(value)) {
      value = value.split(';');
    }
    return value.map((item) => applyPipes(item, pipes)).join(", ");
  }

  for (let pipe of pipes) {
    let pipeArgs = pipe.split(' ').map((s) => s.trim());
    let pipeCommand = pipeArgs.shift();
    pipeArgs = pipeArgs.map((s) => s.replace(/'(.*)'/, '$1'));
    if (pipeFunctions.hasOwnProperty(pipeCommand)) {
      value = pipeFunctions[pipeCommand](value, ...pipeArgs);
    }
  }
  return value;
}

function createBinding(destElem, field, pipes) {
  return function (value) {
    // componentLogger.log("Binding callback");
    componentLogger.indent();

    // componentLogger.log("Processing value of", field, ":", value, pipes);
    value = applyPipes(value, pipes);

    // actually set the value
    // componentLogger.log("Setting value of", field, "=", value);
    componentLogger.indent();
    set(destElem, field, value);
    componentLogger.outdent();
    componentLogger.outdent();
  }
}


/// REACTIVE

class ElementObserver {
  constructor(element) {
    let id = (element.id !== undefined && element.id !== null && element.id != "") ? "#"+element.id : element.tagName;

    this.bindings = {};
    let self = this;

    let mutationObserver = new MutationObserver(function (mutations) {
      for (let mutation of mutations) {
        if (mutation.type == 'attributes') {
          let name = toCamelCase(mutation.attributeName.replace(/^data-/, ''));
          if (name in self.bindings) {
            let bindings = self.bindings[name];
            let value = element.dataset[name];

            componentLogger.log("Observed value", id+"."+name, "=", value, "-- sending to", Object.keys(bindings).length, "observers");
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
    if (target == "#") {
      componentLogger.error("Bad target", target);
    }
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


// SETUP
function setupBindings(container) {
  let nbindings = 0;

  // find all the bindings for this element
  for (let destElem of container.querySelectorAll('*[data-bind]')) {
    let elementBindings = [];

    for (let bind of destElem.dataset.bind.split(';')) {
      if (bind == "") {
        continue;
      }
      let [field, rvalue] = bind.split('=', 2);
      if (field === null || field === undefined || rvalue === null || rvalue === undefined) {
        componentLogger.error("BIND ERROR:", bind, destElem);
        continue;
      }
      field = field.trim();
      rvalue = rvalue.trim();
      let lvalue = field;
      if (isElement(destElem) && destElem.id !== undefined && destElem.id != "") {
        lvalue = "#"+destElem.id+"."+field;
      }
      componentLogger.log("Binding:", lvalue, "to", rvalue);
          
      let pipes = rvalue.split('|').map((s) => s.trim());
      let source = pipes.shift();

      // find the data source element
      let [sourceSelector, sourceAttr] = source.split('.');
      let sourceElem = initObserver(sourceSelector);
      if (sourceElem === undefined || sourceElem === null) {
        componentLogger.log("Source element not found:", sourceSelector);
        continue;
      }

      let bindingFunction = createBinding(destElem, field, pipes);

      // sourceElem.observer.addBinding(sourceAttr, bindingFunction);
      elementBindings.push([sourceElem, sourceAttr, bindingFunction]);
      nbindings++;
    }

    // 1. calculate initial values
    for (let binding of elementBindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      let value = get(sourceElem, sourceAttr);
      bindingFunction(value);
    }

    // 2. attach listeners
    for (let binding of elementBindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      sourceElem.observer.addBinding(sourceAttr, bindingFunction);
    }

    // 3. calculate values again, knowing it'll reflow any changes
    for (let binding of elementBindings) {
      let [sourceElem, sourceAttr, bindingFunction] = binding;
      let value = get(sourceElem, sourceAttr);
      bindingFunction(value);
    }
  }

  componentLogger.log("Bound", nbindings, "values");
}

function getValue(sourceElem, sourceAttr) {
  switch (sourceAttr) {
    case 'content':
      return sourceElem.innerHTML;
    default:
      return sourceElem.dataset[sourceAttr];
  }
}

/// SETUP

window.addEventListener('load', () => {
  setupBindings(body);
});
