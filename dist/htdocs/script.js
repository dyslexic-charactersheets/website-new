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
function has(container, property) {
  if (isNull(container)) return false;
  return Object.prototype.hasOwnProperty.call(container, property) && !isNull(container[property]);
}

function str(val) {
  if (val === undefined || val === null) return "";
  if (typeof val === 'string' || val instanceof String) return val;
  if (val === false) return "false";
  if (val === true) return "true";
  
  console.log("How to make a string?", val);
  return "?";
}

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

function isNull(val) {
  return val === null || val === undefined;
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
function checkSignature(message, signature, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(message);
    hash.update(salt);
    var signature2 = hash.digest('hex');

    return signature == signature2;
}

function initIsLoggedIn() {
  body.dataset.loggedIn = false;

  // get the cookie value
  let cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("login="))
    ?.split("=")[1];

  if (cookieValue === undefined) {
    return;
  }
  
  let cookieParts = cookieValue.split(/:/);
  let loginToken = cookieParts[0];
  let signature = cookieParts[1];

  if (checkSignature(loginToken, signature, sessionKey)) {
    body.dataset.loggedIn = true;
  }
}

// async init
setTimeout(initIsLoggedIn, 1);

function isLoggedIn() {
  // TODO login
  return bool(body.dataset.loggedIn);
}
function generateId() {
  return Math.floor(Math.random() * 10000000000).toString(16);
}
let componentLogger = getDebug('components');
enableDebug('components');


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

function get(target, field) {
  componentLogger.log("Get ", target, field);
  if (isElement(target)) {
    switch (field) {
      case 'checked':
        return bool(target.checked);
      case 'disabled':
        return bool(target.disabled);
      case 'content':
        return target.innerHTML;
      case 'value':
        return target.value;
      case 'class':
        return target.className;
      default:
        return target.dataset[field];
    }
  } else {
    let value = null;
    all(target, (elem) => {
      value = get(elem, field);
    });
    return value;
  }
}

// set an element's attribute
function set(target, field, value) {
  componentLogger.log("Set ", target, field, value);
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
      value = str(value);
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
          target.value = value; // target.setAttribute(field, value);
          emit(target, 'change');
          break;

        case 'checked':
        case 'disabled':
          value = bool(value);
          let existing = bool(target[field])
          if (existing == value) {
            return;
          }
          target[field] = value;
          // target.toggleAttribute(field, value);
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
          break;
      }
    }
  } else {
    componentLogger.indent();
    all(target, (elem) => {
      set(elem, field, value);
    });
    componentLogger.outdent();
  }
}

function setToggleInList(target, field, value, enable) {
  let existing = get(target, field);
  let toggleSet = (existing === undefined || existing == null) ? new Set() : new Set(existing.split(';'));

  if (enable) {
    toggleSet.add(value);
  } else {
    toggleSet.delete(value);
  }

  let newvalue = [...toggleSet].sort().join(';');
  if (newvalue != existing) {
    set(target, field, newvalue);
  }
}

function deepReplace(element, original, replacement) {
  // attributes
  if (element.hasAttributes()) {
    let attribs = element.getAttributeNames();
    for (let attrib of attribs) {
      if (element.getAttribute(attrib).match(original)) {
        let newValue = element.getAttribute(attrib).replaceAll(original, replacement)
        element.setAttribute(attrib, newValue);
      }
    }
  }

  // data

  // text content

  // children
  for (let child of element.children) {
    if (child instanceof HTMLElement) {
      deepReplace(child, original, replacement);
    } else if (child instanceof TextNode) {
      if (child.innerText.match(original)) {
        child.innerText = child.innerText.replaceAll(original, replacement);
      }
    }
  }
}

// cf https://stackoverflow.com/a/44670818
function respondToVisibility(element, callback) {
  var options = {
    root: document.documentElement,
  };

  var observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      callback(entry.intersectionRatio > 0);
    });
    observer.disconnect(); // stop observing
  }, options);

  observer.observe(element);
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
    componentLogger.log("Setting value of", field, "=", value);
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

      // pre-fill data from inputs
      if (destElem.tagName == "INPUT") {
        if (destElem.type == "checkbox") {
          if (destElem.checked) {
            componentLogger.log("Pre-fill checkbox", sourceElem, sourceAttr, "=", true);
            componentLogger.indent();
            set(sourceElem, sourceAttr, "true");
            componentLogger.outdent();
          }
        } else if (destElem.type == "radio") {
          if (destElem.checked) {
            componentLogger.log("Pre-fill radio", sourceElem, sourceAttr, "=", destElem.value);
            componentLogger.indent();
            set(sourceElem, sourceAttr, destElem.value);
            componentLogger.outdent();
          }
        } else {
          componentLogger.log("Pre-fill value", sourceElem, sourceAttr, "=", destElem.value);
          componentLogger.indent();
          set(sourceElem, sourceAttr, destElem.value);
          componentLogger.outdent();
        }
      }

      // make the function to call on data changes
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
//  -- BUILD WIZARD --  //

let downloadDisabled = false;
function downloadCharacterSheet(request) {
  // don't download twice at once...
  if (downloadDisabled) {
    return;
  }
  downloadDisabled = true;

  // ...but timeout quickly
  downloadTimeout = setTimeout(function () {
    downloadDisabled = false;
    clearTimeout(downloadTimeout);
  });

  // the request
  let doc = JSON.stringify(request);

  let url = '/download';
  switch (request.data.attributes.game) {
    case 'pathfinder':
    case 'pathfinder1':
      url = '/download/pathfinder1';
      break;

    case 'starfinder':
    case 'starfinder1':
      url = '/download/starfinder1';
      break;

    case 'dnd35':
      url = '/download/dnd35';
      break;

    case 'pathfinder2':
    case 'pathfinder2remaster':
    case 'starfinder2':
      url = '/download/pathfinder2';
      break;
  }

  const options = {
    method: 'POST',
    body: doc,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  fetch(url, options)
    .then((res) => {
      // get the filename from the headers
      let fileName = 'file.html';
      let contentDispo = res.headers.get('Content-Disposition');
      if (contentDispo) {
        fileName = contentDispo.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
        if (fileName.startsWith('"') && fileName.endsWith('"')) {
          fileName = fileName.substring(1, fileName.length - 1);
        }
      }
      
      // download the file
      res.blob().then((data) => {
        let a = document.createElement('a');
        a.href = window.URL.createObjectURL(data);
        a.download = fileName;
        a.dispatchEvent(new MouseEvent('click'));
      });
    })
    .catch((err) => console.log(err));

  
  downloadDisabled = false;
}
let logger = getDebug('build-classic');

function readClassicFormAndSubmit(type) {
  logger.log("Download");
  
  let request = readClassicForm(type);
  if (isLoggedIn()) {
    saveCharacter(request);
  }
  downloadCharacterSheet(request);
}

function readCheckbox(name) {
  for (let checkbox of document.getElementsByName(name)) {
    if (checkbox.checked) {
      return true;
    }
  }
  return false;
}

function readRadio(name) {
  let value = false;
  for (let radio of document.getElementsByName(name)) {
    if (radio.checked) {
      value = radio.value;
    }
  }
  return value;
}

function readInput(name) {
  for (let input of document.getElementsByName(name)) {
    return input.value;
  }
}

function readSelect(name) {
  let value = false;
  for (let select of document.getElementsByName(name)) {
    for (let option of select.options) {
      if (option.selected) {
        value = option.value;
      }
    }
  }
  return value;
}

function readClassicForm(type) {
  var form = document.getElementById("build-form");
  var game = form.dataset.game;
  var id = generateId();

  var character = {
    type,
    id,
    attributes: {
      game: game,
      isLoggedIn: isLoggedIn(),
      language: document.getElementById("body").dataset.language,
      classes: []
    }
  };

  // direct value map functions
  function mapCheckbox(name, attrib) {
    if (readCheckbox(name)) {
      character.attributes[attrib] = true;
      return true;
    }
    return false;
  }

  function mapRadio(name, attrib) {
    character.attributes[attrib] = readRadio(name);
    return character.attributes[attrib];
  }

  function mapInput(name, attrib) {
    character.attributes[attrib] = readInput(name);
    return character.attributes[attrib];
  }

  function mapSelect(name, attrib) {
    character.attributes[attrib] = readSelect(name);
    return character.attributes[attrib];
  }

  function mapAllSelects(name, attrib, limit = 10) {
    character.attributes[attrib] = [];
    for (let i = 0; i < limit; i++) {
      let skill = readSelect(name+"-"+i);
      let visible = false;
      for (let select of document.getElementsByName(name+"-"+i)) {
        let repeatableInstance = select.closest('.repeatable__instance');
        if (repeatableInstance.classList.contains('repeatable__instance--visible')) {
          visible = true;
        }
      }

      if (skill && visible) {
        character.attributes[attrib].push(skill);
      }
    }
    return character.attributes[attrib];
  }

  // attach images
  let attachments = [];
  function mapImage(name, value) {
    if (value === undefined || value === null || value == "") {
      return;
    }
    
    if (value.startsWith("data:")) {
      imageId = generateId();
      
      attachments.push({
        type: "image",
        id: imageId,
        data: value
      });

      character.attributes[name] = {
        type: "image",
        id: imageId
      };
    } else {
      character.attributes[name] = value;
    }
  }


  // game options
  switch(type) {
    // Character pages
    case 'character':
      // classes
      for (let classCheckbox of document.querySelectorAll('[data-class]')) {
        if (classCheckbox.checked) {
          var classname = classCheckbox.dataset['class'];
          var cls = { "class": classname };

          let variantSelects = document.querySelectorAll('[data-variant-for='+classname+']');
          if (variantSelects.length == 1) {
            cls.variant = [ variantSelects[0].value ];
          } else {
            cls.variant = [];
            for (let variantSelect of variantSelects) {
              let axis = variantSelect.dataset.variantAxis;
              cls.variant[axis] = variantSelect.value;
            }
          }

          character.attributes.classes.push(cls);
        }
      }

      mapCheckbox("permission", "permission");
      mapRadio("colour", "printColour");
      if (readCheckbox("has-watermark")) {
        mapInput("watermark", "watermark");
      }

      mapCheckbox("simple", "simple");
      mapCheckbox("more", "more");

      mapSelect("spellbook-size", "spellbookSize");
      mapSelect("inventory-style", "inventoryStyle");

      mapRadio("skills-list-style", "skillsListStyle");
      mapCheckbox("all-knowledge", "allKnowledge");
      if (readCheckbox("show-perform")) {
        mapAllSelects("perform-skill", "performSkills");
      }
      if (readCheckbox("show-craft")) {
        mapAllSelects("craft-skill", "craftSkills");
      }
      if (readCheckbox("show-profession")) {
        mapAllSelects("profession-skill", "professionSkills");
      }

      // additional pages
      mapCheckbox("build-my-character", "buildMyCharacter");
      if (mapCheckbox("include-background", "includeCharacterBackground") && game == "pathfinder") {
        character.attributes.characterBackgroundStyle = readCheckbox("include-pathfinder-society") ? "pathfinder-society" : "normal";
      }
      
      mapCheckbox("include-animal-companion", "includeAnimalCompanion");
      mapCheckbox("include-party-funds", "includePartyFunds");
      mapCheckbox("include-lycanthrope", "includeLycanthrope");
      mapCheckbox("include-intelligent-item", "includeIntelligentItem");
      mapCheckbox("include-mini", "includeMini");
      mapRadio("mini-size", "miniSize");

      switch(game) {
        case "pathfinder":
        case "dnd35":
          break;
      }

      mapImage("portrait", readInput("portrait"));
      mapImage("logo", readInput("logo"));
      break;
    
    // GM Downloads
    case 'gm':
      mapCheckbox("gm-permission", "permission");
      mapRadio("gm-colour", "printColour");

      let gmPick = mapInput("gm-pick", "gmPick");
      switch (gmPick) {
        case "characters":
          mapSelect("num-pcs", "numPCs");
          break;

        case "maps":
          mapRadio("maps-view", "mapsView");
          break;

        case "campaign":
          break;

        default:
          return;
      }

      break;

    case 'kingdom':
      mapRadio("settlement-style", "settlementStyle");
      mapRadio("kingdom-colour", "printColour");
      break;

    case 'starship':
      mapRadio("starship-colour", "printColour");
      break;

    case 'mini':
      mapRadio("mini-colour", "printColour");
      mapRadio("mini-mini-size", "miniSize");
      mapImage("portrait", readInput("mini-portrait"));
      break;
  }

  // make the full request object
  var request = {
    "version": 0,
    "data": character,
    "included": attachments
  };

  return request;
}
let pf2logger = getDebug('build-pf2');

function readPf2FormAndSubmit(type) {
  pf2logger.log("Download");
  
  let request = readPf2Form(type);
  if (isLoggedIn()) {
    saveCharacter(request);
  }
  downloadCharacterSheet(request);
}

function readPf2Form(type) {
  var form = document.getElementById("build-form");

  let dataset = form.dataset;
  var edition = dataset.edition;
  var id = generateId();

  var character = {
    type,
    id,
    attributes: {
      game: edition,
      isLoggedIn: isLoggedIn(),
      edition: edition,
      language: document.getElementById("body").dataset.language,
      classes: []
    }
  };

  function getInputValue(id) {
    let input = document.getElementById(id);
    if (input === undefined || input === null) {
      return null;
    }
    return input.value;
  }

  function readMultiselect(code) {
    let values = [];
    for (let i = 0; i <= dataset[`${code}Num`]; i++) {
      let index = `${code}_${i}`;
      if (dataset.hasOwnProperty(index)) {
        let value = dataset[index];
        if (value !== undefined && value !== null && value != "") {
          values.push(value);
        }
      }
    }
    return values;
  }

  function readBoolean(code) {
    let value = dataset[code];
    return value == "true";
  }

  // attach images
  let attachments = [];
  function mapImage(name, value) {
    if (value === undefined || value === null || value == "") {
      return;
    }
    
    if (value.startsWith("data:")) {
      imageId = generateId();
      
      attachments.push({
        type: "image",
        id: imageId,
        data: value
      });

      character.attributes[name] = {
        type: "image",
        id: imageId
      };
    } else {
      character.attributes[name] = value;
    }
  }

  switch (type) {
    // Character pages
    case 'character':
      // basic properties
      character.attributes.ancestry = dataset.ancestry;
      character.attributes.heritage = dataset.heritage;
      character.attributes.background = dataset.background;
      character.attributes['class'] = dataset.cls;

      // subclass and/or feats
      if ('clsSelects' in dataset) {
        for (let sel of dataset.clsSelects.split(',')) {
          let selectkey = toCamelCase(sel.replaceAll('/', '-'));
          character.attributes[sel] = dataset[selectkey];
        }
      }

      character.attributes.multiclass = readMultiselect("multiclass");
      // TODO sub-multiclass
      character.attributes.archetypes = readMultiselect("archetype");
      // TODO sub-archetype
      
      character.attributes.feats = [];
      if (readBoolean("featDiehard")) {
        character.attributes.feats.push("diehard");
      }

      character.attributes.optionCover = readBoolean("pageCover");
      character.attributes.optionReference = readBoolean("pageReference"),
      character.attributes.optionActions = readBoolean("pageActions");
      character.attributes.optionBuild = readBoolean("pageBuild"),
      character.attributes.optionMinis = readBoolean("pageMinis");
      character.attributes.miniSize = dataset["pageSizeMini"];

      character.attributes.optionCharacterBackground = readBoolean("pageCharacterBackground");
      character.attributes.optionLevelUp = readBoolean("pageLevelUp");
      // character.attributes.optionPfs: false,

      character.attributes.inventoryStyle = dataset["pageInventory"];
      character.attributes.optionInventoryExtra = readBoolean("pageInventoryExtra");
      character.attributes.optionAnimalCompanion = readBoolean("pageAnimalCompanion");
      character.attributes.optionFamiliar = readBoolean("pageFamiliar");
      character.attributes.optionConstruct = readBoolean("pageConstruct");

      character.attributes.optionFreeArchetype = readBoolean("optionFreeArchetype");
      character.attributes.optionAncestryParagon = readBoolean("ancestryParagon");
      character.attributes.optionAutomaticBonusProgression = readBoolean("automaticBonusProgression");
      character.attributes.optionAutomaticWeaponProgression = readBoolean("automaticWeaponProgression");
      character.attributes.optionProficiencyWithoutLevel = readBoolean("proficiencyWithoutLevel");
      break;

    case 'gm':
      character.attributes.gm = dataset["gm"];

      switch (character.attributes.gm) {
        case 'characters':
          character.attributes.optionGmParty = readBoolean("pageGmParty");
          character.attributes.optionGmNpcParty = readBoolean("pageGmNpcGroup");
          character.attributes.optionGmNpc = readBoolean("pageGmNpc");
          break;

        case 'maps':
          character.attributes.mapView = dataset["pageGmMaps"];
          break;
      }
      break;

    case 'kingmaker':
      break;

    case 'mini':
      break;

    default:
      return null;
  }
  
  // common fields
  character.attributes.optionPermission = readBoolean("pagePermission");

  // appearance
  switch (dataset.pageBackground) {
    case 'magnolia':
      character.attributes.printBackground = 'magnolia';
      break;
    case 'parchment':
      character.attributes.printBackground = 'backgrounds/paper3.jpg';
      break;
    case 'frost':
      character.attributes.printBackground = 'backgrounds/frost1.jpg';
      break;
  }

  character.attributes.printColour = dataset.baseColour;
  character.attributes.accentColour = dataset.accentColour;
  character.attributes.printBrightness = dataset.printBrightness;
  character.attributes.printWatermark = dataset.watermark;

  // accessibility
  character.attributes.printHighContrast = readBoolean("highContrast");
  character.attributes.printLarge = readBoolean("largePrint");
  character.attributes.optionColourful = readBoolean("colourful");
  character.attributes.printDyslexic = readBoolean("dyslexic");
  if (character.attributes.printDyslexic) {
    character.attributes.printDyslexicFont = dataset.dyslexicFont;
  }

  // images
  switch (type) {
    // Character pages
    case 'character':
      mapImage('printPortrait', getInputValue('data-image-portrait'));
      mapImage('printLogo', getInputValue('data-image-logo'));
      mapImage('printAnimal', getInputValue('data-image-animal'));
      break;

    case 'gm':
      break;

    case 'kingmaker':
      break;

    case 'mini':
      break;

    default:
      return null;
  }

  // make the full request object
  var request = {
    "version": 0,
    "data": character,
    "included": attachments
  };

  return request;
};
addEventListener('load', () => {
  try {
on("input[type='checkbox']", "change", (evt) => {
  let checkbox = evt.target;
  if (checkbox.dataset.var) {
    set("#build-form", checkbox.dataset.var, checkbox.checked);
  }
});

// pre-fill form data with current selection for all radio groups
// all("input[type='checkbox']:checked", (checkbox) => {
//   let rvar = checkbox.dataset.var;
//   if (isString(rvar) && rvar != "") {
//     set("#build-form", rvar, true);
//   }
// });
} catch (e) { 
  console.log("Error in Checkbox", e)
}
try {
function colourValue(colour) {
  if (colour.match(/#[A-Z0-9]{6}/)) {
    return colour;
  }

  switch (colour) {
    case 'red':
      return '#BF4C4C';
    case 'orange':
      return '#CC843D';
    case 'gold':
      return '#CCAF1F';
    case 'lime':
      return '#76A632';
    case 'green':
      return '#42A642';
    case 'teal':
      return '#3AA66E';
    case 'cyan':
      return '#32A6A6';
    case 'azure':
      return '#3F83B3';
    case 'blue':
      return '#485AB3';
    case 'indigo':
      return '#663FB3';
    case 'violet':
      return '#A03FB3';
    case 'magenta':
      return '#B33F7A';
    case 'red2':
      return '#BF6969';
    case 'orange2':
      return '#BF8A56';
    case 'gold2':
      return '#CCB952';
    case 'lime2':
      return '#91B362';
    case 'green2':
      return '#6BB36B';
    case 'teal2':
      return '#62B389';
    case 'cyan2':
      return '#74B3B3';
    case 'azure2':
      return '#699BBF';
    case 'blue2':
      return '#7380BF';
    case 'indigo2':
      return '#8669BF';
    case 'violet2':
      return '#B169BF';
    case 'magenta2':
      return '#BF6994';
    case 'grey':
      return '#8C8C8C';
  }
  return '#8C8C8C';
}

on ('.colour-output__inner', 'click', (evt) => {
  let select = evt.currentTarget.dataset['select'];
  set('body', 'currentMenu', select);
});

on('.colour-output input', 'change', (evt) => {
  let value = evt.currentTarget.value;
  let output = evt.currentTarget.closest('.colour-output');
  for (let pallette of output.querySelectorAll('.colour-output__pallette')) {
    pallette.style.backgroundColor = colourValue(value);
  }
});
} catch (e) { 
  console.log("Error in ColourOutput", e)
}
try {
on('.colour-wheel input[type="radio"]', 'change', (evt) => {
  let radio = evt.currentTarget;
  let wheel = radio.closest('.colour-wheel');
  set('#build-form', wheel.dataset.field, radio.value);
  emit(wheel, 'close-menu');
});

function colourName(name) {
  switch (name) {
    case 'red': case 'red2': return __("Red");
    case 'orange': case 'orange2': return __("Orange");
    case 'gold': case 'gold2': return __("Gold");
    case 'lime': case 'lime2': return __("Lime");
    case 'green': case 'green2': return __("Green");
    case 'teal': case 'teal2': return __("Teal");
    case 'cyan': case 'cyan2': return __("Cyan");
    case 'azure': case 'azure2': return __("Azure");
    case 'blue': case 'blue2': return __("Blue");
    case 'indigo': case 'indigo2': return __("Indigo");
    case 'violet': case 'violet2': return __("Violet");
    case 'magenta': case 'magenta2': return __("Magenta");
    case 'grey': return __("Grey");
    default: return name;
  }
}

definePipe('colourName', (name) => {
  return colourName(name);
});
} catch (e) { 
  console.log("Error in ColourSelectMenu", e)
}
try {
on("input[type='text'][data-var]", "change", (evt) => {
  let input = evt.target;
  set("#build-form", input.dataset.var, input.value);
});
} catch (e) { 
  console.log("Error in Input", e)
}
try {
on("#new-character-menu", "reveal-pf2", (evt) => {
  emit("#pf2-edition", "reveal", evt);
});
} catch (e) { 
  console.log("Error in NewCharacterMenu", e)
}
try {
// on('output[on-click]','click', (evt) => {
//   let onClick = 
// });
} catch (e) { 
  console.log("Error in Output", e)
}
try {
all(".page-option input[type=checkbox]", (checkbox) => {
  set("#build-form", toCamelCase(checkbox.name), checkbox.checked);
});

on(".page-option img", "click", (evt) => {
  let img = evt.target;
  let pageOption = img.closest('.page-option');
  for (let input of pageOption.querySelectorAll('input')) {
    input.click();
  }
});
} catch (e) { 
  console.log("Error in PageOption", e)
}
try {
on("input[type='radio']", "change", (evt) => {
  let radio = evt.target;
  let rvar = radio.dataset.var;
  let value = radio.value;
  if (radio.checked && isString(rvar) && rvar && isString(value) && value) {
    set("#build-form", rvar, value);
  }
});

// pre-fill form data with current selection for all radio groups
// all("input[type='radio']:checked", (radio) => {
//   let rvar = radio.dataset.var;
//   let value = radio.value;
//   if (isString(rvar) && rvar != "" && isString(value) && value != "") {
//     set("#build-form", rvar, value);
//   }
// });
} catch (e) { 
  console.log("Error in Radio", e)
}
try {
on('.repeatable__more', 'click', (evt) => {
  let repeatable = evt.target.closest('.repeatable');
  let max = repeatable.dataset.max;
  let count = repeatable.querySelectorAll('.repeatable__instance').length;

  if (count >= max) {
    return;
  }

  let next = parseInt(repeatable.dataset.next);
  repeatable.dataset.next = next + 1;

  let template = repeatable.querySelector("template");
  let newInstance = template.content.cloneNode(true).firstElementChild;
  newInstance.dataset.instance = next;
  deepReplace(newInstance, '%%', next);
  let removeButton = newInstance.querySelector('.repeatable__remove');

  let repeatableArea = repeatable.querySelector('.repeatable__area');
  repeatableArea.appendChild(newInstance);

  setupBindings(newInstance);
  setupSignals(newInstance);

  on(removeButton, 'click', (evt) => {
    newInstance.remove();
  });
});

on('.repeatable__remove', 'click', (evt) => {
  let instance = evt.target.closest('.repeatable__instance');
  instance.remove();
})
} catch (e) { 
  console.log("Error in Repeatable", e)
}
try {
let slideshowDebug = getDebug('Slideshow');
// enableDebug('Slideshow');

all('.slideshow', (slideshow) => {
  const dolly = slideshow.querySelector('.slideshow__dolly');
  const isVertical = slideshow.classList.contains('slideshow--v');
  const slides = slideshow.getElementsByClassName('slide');

  // Finish set up
  if (!isVertical) {
    // correct the width of the elements, since a horizontal slideshow won't be full-width
    let width = slideshow.offsetWidth;
    for (let slide of slideshow.querySelectorAll('.slide')) {
      slide.style.width = width+'px';
    }
  }

  // Auto-progression
  if (slideshow.classList.contains('slideshow--auto')) {
    setTimeout(() => {
      setInterval(() => {
        slideshowDebug.log("Auto next slide");
        emit(slideshow, 'next-slide');
      }, 2000);
    }, 5000);
  }

  function getCurrentSlide() {
    let jumpto = slideshow.dataset.jump;
    let slideElem = slideshow.querySelector('.slide[data-jump="'+slide+'"]');
  }

  // Scroll to a slide
  function snapScroll() {
    slideshowDebug.log("snapScroll");
    let jumpto = slideshow.dataset.jump;
    slideshowDebug.log("Jump to slide", jumpto);

    let scrollStart = isVertical ? slideshow.scrollTop : slideshow.scrollLeft;
    let scrollEnd = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth);

    let slideElem = slideshow.querySelector('.slide[data-jump="'+jumpto+'"]');
    let slideStart = isVertical ? slideElem.offsetTop : slideElem.offsetLeft;
    let slideMiddle = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth) / 2;
    let slideEnd = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth);

    // snap the scroll position
    if (scrollStart < slideStart) {
      slideshowDebug.log("  Scrolling to", jumpto, "at", slideStart);
      if (isVertical) {
        slideshow.scrollTo(0, slideStart - slideshow.offsetTop);
      } else {
        slideshow.scrollTo(slideStart - slideshow.offsetLeft, 0);
      }
    } else if (scrollEnd > slideEnd) {
      slideshowDebug.log("  Scrolling to end of", jumpto);
      if (isVertical) {
        let to = slideEnd - slideshow.offsetHeight;
        slideshowDebug.log("    ", slideEnd, "-", slideshow.offsetHeight, "=", to);
        if (to < slideStart) {
          slideshowDebug.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        slideshowDebug.log("    Bottom", to);
        slideshow.scrollTo(0, to - slideshow.offsetTop);
      } else {
        let to = slideEnd - slideshow.offsetWidth;
        slideshowDebug.log("    ", slideEnd, "-", slideshow.offsetWidth, "=", to);
        if (to < slideStart) {
          slideshowDebug.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        slideshowDebug.log("    Right", to);
        slideshow.scrollTo(to - slideshow.offsetLeft, 0);
      }
    }

    // adjust parameters
    let slideshowExtent = isVertical ? dolly.offsetHeight : dolly.offsetWidth;
    let isFirstSlide = slideStart <= 0;
    let isLastSlide = slideEnd >= slideshowExtent;
    set(slideshow, 'showPrevButton', bool(slideElem.dataset.showPrevButton) && !isFirstSlide);
    set(slideshow, 'showNextButton', bool(slideElem.dataset.showNextButton) && !isLastSlide);
  }

  watch(slideshow, 'data-jump', snapScroll);

  // Scroll behaviour
  let scrollTimeout = null;
  function endScroll() {
    slideshowDebug.log("endScroll");
    clearTimeout(scrollTimeout);
    let oldSlide = slideshow.dataset.jump;

    let scrollStart = isVertical ? (slideshow.scrollTop + slideshow.offsetTop) : (slideshow.scrollLeft + slideshow.offsetLeft);
    let scrollMiddle = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth) / 2;
    slideshowDebug.log(`Finished scroll ${scrollStart} ${scrollMiddle}`);

    // find the landing slide
    let newSlide = slides[0];

    let smallestdistance = 100000;
    for (let slideElem of slides) {
      let slide = slideElem.dataset.jump;
      // let slideElem = slideshow.querySelector('.slide[data-jump="'+slide+'"]');

      // skip invisible slides
      if (!slideElem.offsetParent === null) {
        continue;
      }

      let slideStart = isVertical ? slideElem.offsetTop : slideElem.offsetLeft;
      let slideMiddle = slideStart + (isVertical ? slideElem.clientHeight : slideElem.clientWidth) / 2;
      let slideEnd = slideStart + (isVertical ? slideElem.clientHeight : slideElem.clientWidth);
      slideshowDebug.log(`  Slide '${slide}' range ${slideStart} ${slideEnd}`);
      if (slideEnd > slideStart && scrollMiddle >= slideStart && scrollMiddle <= slideEnd) {
        let distance = Math.abs(scrollMiddle - slideMiddle);
        slideshowDebug.log(`    Slide middle ${slideMiddle} distance ${distance}`);
        if (distance < smallestdistance) {
          smallestdistance = distance;
          newSlide = slide;
        }
      }
    }
    
    // snap to it
    slideshowDebug.log("Finished on slide", newSlide);
    if (newSlide !== undefined && newSlide !== null) {
      slideshow.dataset.jump = newSlide;
    }
  }

  // When scrolling is finished, wait a beat then snap to the nearest slide
  on(slideshow, 'scroll', (evt) => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(endScroll, 200);
  });

  // Buttons
  on(slideshow, 'prev-slide', (evt) => {
    slideshowDebug.log("Prev slide");
    if (isVertical) {
      let to = slideshow.scrollTop - slideshow.clientHeight;
      slideshow.scrollTo(0, to);
    } else {
      let to = slideshow.scrollLeft - slideshow.clientWidth;
      slideshow.scrollTo(to, 0);
    }
  });

  on(slideshow, 'next-slide', (evt) => {
    slideshowDebug.log("Next slide");
    let jumpto = slideshow.dataset.jump;
    let slideElem = slideshow.querySelector('.slide[data-jump="'+jumpto+'"]');
    let nextSlide = slideElem.nextSibling;
    while (!(nextSlide instanceof Element)) {
      nextSlide = nextSlide.nextSibling;
      // circle back round to the first element
      if (nextSlide === null) {
        nextSlide = dolly.children[0];
      }
      // if we get back to where we started, give up rather than loop forever
      if (nextSlide == slideElem) {
        return;
      }
    }
    slideshow.scrollTo(nextSlide.offsetLeft - slideshow.offsetLeft, nextSlide.offsetTop - slideshow.offsetTop);

    // if (isVertical) {
    //   let currentSlide
    //   let to = slideshow.scrollTop + slideshow.clientHeight;
    //   slideshow.scrollTo(0, to);
    // } else {
    //   let to = slideshow.scrollLeft + slideshow.clientWidth;
    //   slideshow.scrollTo(to, 0);
    // }
  });

  // on(slideshow, 'jump-to-slide', (evt) => {
  //   slideshow.dataset.jump = '';
  // });
});
} catch (e) { 
  console.log("Error in Slideshow", e)
}
try {
all('.slideshow-buttons', (slideshowButtons) => {
  let slideShow = document.getElementById(slideshowButtons.dataset.for);
  
  on(slideshowButtons, 'next-slide', (evt) => {
    emit(slideShow, 'next-slide');
  });

  on(slideshowButtons, 'prev-slide', (evt) => {
    emit(slideShow, 'prev-slide');
  });
});
} catch (e) { 
  console.log("Error in SlideshowButtons", e)
}
try {
all('.switch', (sw) => {
  function updateCase() {
    let current = sw.dataset.current;
    // for (let swCase of sw.getElementsByClassName('switch__case')) {
    // for (let swCase of sw.querySelectorAll('> .switch___case')) {
    for (let swCase of sw.children) {
      if (swCase.classList.contains('switch__case')) {
        swCase.dataset.show = swCase.dataset.value == current;
      }
    }
  }

  watch(sw, 'data-current', updateCase);
  updateCase();
});

on('.switch', 'switch', (event, sw) => {
  if (event.hasOwnProperty('details') && event.details.hasOwnProperty('pick') && event.details.pick !== null && event.details.pick != "") {
    sw.dataset.current = event.details.pick;
  }
});
} catch (e) { 
  console.log("Error in Switch", e)
}
try {
on('#simple', 'change', (evt) => {
  if (readCheckbox('simple')) {
    set('#more', 'checked', false);
  }
});

on('#more', 'change', (evt) => {
  if (readCheckbox('more')) {
    set('#simple', 'checked', false);
  }
});

on('#download-character', 'click', (evt) => {
  readClassicFormAndSubmit('character');
});

on('#download-gm', 'click', (evt) => {
  readClassicFormAndSubmit('gm');
});

on('#download-kingdom', 'click', (evt) => {
  readClassicFormAndSubmit('kingdom');
});

on('#download-starship', 'click', (evt) => {
  readClassicFormAndSubmit('starship');
});

on('#download-mini', 'click', (evt) => {
  readClassicFormAndSubmit('mini');
});
} catch (e) { 
  console.log("Error in BuildFormClassic", e)
}
try {
on("input[type='search']", "change", (evt) => {
  console.log("Search");
});

all('.form-select-menu', (menu) => {
  let menuId = menu.id;
  let fieldCode = menu.dataset.code;

  on(menu, 'form-select', (evt) => {
    let detail = {
      value: evt.detail[0],
      select: evt.target.dataset.select,
      meta: evt.target.dataset
    };
    console.log("Form select", menuId, "field:", fieldCode, "value:", detail, "event:", evt);
    emit(menu, 'form-select:'+fieldCode, detail, evt);
  })
});
} catch (e) { 
  console.log("Error in FormSelectMenu", e)
}
try {
let pageEdition = '';
onloaded(() => {
  pageEdition = get('#build-form', 'edition');
  all('.facet-edition', (elem) => {
    set(elem, 'value', pageEdition);
  });
  
  all('.facet-search-tools', (elem) => {
    emit(elem, 'facet-change');
  })
});


on('.facet-search-tools', 'facet-change', (evt) => {
  let searchBar = evt.currentTarget;
  if (!searchBar.classList.contains('facet-search-tools')) {
    searchBar = searchBar.closest('.facet-search-tools');
  }

  let searchParams = {
    edition: pageEdition,
    source: '',
    rarity: '',
    search: '',
  };

  for (let facet of searchBar.querySelectorAll('.facet-select')) {
    let value = get(facet, 'value');
    if (facet.classList.contains('facet-edition')) {
      searchParams.edition = value;
    } else if (facet.classList.contains('facet-source')) {
      searchParams.source = value;
    } else if (facet.classList.contains('facet-rarity')) {
      searchParams.rarity = value;
    }
  }
  for (let searchBox of searchBar.querySelectorAll('.facet-search-box')) {
    searchParams.search = searchWords(searchBox.value);
  }

  let listId = searchBar.dataset.list;
  let list = document.getElementById(listId);
  updateItemList(list, searchParams);
});

function searchWords(str) {
  if (str === undefined || str === null || str == "") {
    return [];
  }
  let words = str.toLowerCase().split(' ');
  words = words.map((word) => word.trim());
  words = words.filter((word) => word != "");
  return words;
}
} catch (e) { 
  console.log("Error in ItemFacetSearchTools", e)
}
try {
function updateItemList(list, searchParams) {
  if (list === null) {
    return;
  }
  // hide buttons that don't match the query params
  for (let btn of list.querySelectorAll('.btn')) {
    let meta = btn.dataset;
    let visible = itemMatchesSearchParams(meta, searchParams);
    btn.classList.toggle('btn--hidden', !visible);
  }
  // hide groups with no visible results
  for (let grp of list.querySelectorAll('.item-list__group')) {
    let hasAny = false;
    for (let btn of grp.querySelectorAll('.btn')) {
      if (!btn.classList.contains('btn--hidden')) {
        hasAny = true;
      }
    }
    grp.classList.toggle('item-list__group--hidden', !hasAny);
    grp.previousElementSibling.classList.toggle('h3--hidden', !hasAny);
  }
}

function itemMatchesSearchParams(item, params) {
  if ('edition' in params && params.edition != "" && params.edition != "all" && 'edition' in item && item.edition != params.edition) {
    return false;
  }

  if ('source' in params && params.source != "" && 'source' in item && item.source != params.source) {
    return false;
  }

  if ('rarity' in params && params.rarity != "" && 'rarity' in item && item.rarity != params.rarity) {
    return false;
  }

  if ('search' in params && params.search != "" && 'name' in item) {
    let content = item.name.toLowerCase();
    for (let word of params.search) {
      if (content.match(word)) {
        return true;
      }
    }
    return false;
  }
  return true;
}
} catch (e) { 
  console.log("Error in ItemList", e)
}
try {
// on()
on('.pretty-preset-button', 'click', (evt) => {
  console.log("Pretty preset");

  set('#build-form', 'baseColour', 'blue2');
  set('#build-form', 'accentColour', 'magenta');
  set('#build-form', 'pageBackground', 'parchment');

  set('#build-form', 'underlay', true);
  set('#build-form', 'colourful', true);
  set('#build-form', 'largePrint', false);
  set('#build-form', 'dyslexicFonts', false);
  set('#build-form', 'highContrast', false);
});

on('.dyslexic-preset-button', 'click', (evt) => {
  console.log("Dyslexic preset");
  
  set('#build-form', 'baseColour', 'blue2');
  set('#build-form', 'accentColour', 'magenta');
  set('#build-form', 'pageBackground', 'magnolia');

  set('#build-form', 'underlay', false);
  set('#build-form', 'colourful', true);
  set('#build-form', 'largePrint', false);
  set('#build-form', 'dyslexicFonts', true);
  set('#build-form', 'highContrast', false);
});
} catch (e) { 
  console.log("Error in BuildFormPF2_AppearanceSlide", e)
}
try {
on('.button-download-pf2', 'click', (evt) => {
  evt.preventDefault();

  let btn = evt.target;
  let type = btn.dataset.type;
  readPf2FormAndSubmit(type);
});
} catch (e) { 
  console.log("Error in BuildFormPF2_DownloadSlide", e)
}
try {
on('#portrait', 'select-image', (evt) => {
  // console.log('Select image (portrait)');
  // let target = evt.currentTarget;
  set('body', 'currentMenu', 'portrait-menu');
  // emit('#portrait-menu .lazy', 'reveal');
});

on('#logo', 'select-image', (evt) => {
  // console.log('Select image (logo)');
  // let target = evt.currentTarget;
  set('body', 'currentMenu', 'logo-menu');
  // emit('#logo-menu .lazy', 'reveal');
});
} catch (e) { 
  console.log("Error in BuildFormPF2_PictureSlide", e)
}
try {
const urlParams = new URLSearchParams(window.location.search);
const edition = urlParams.get('edition');
if (edition == "pathfinder2") {
  document.getElementById('build-form').dataset.edition = "pathfinder2";
} else if (edition == "pathfinder2remaster") {
  document.getElementById('build-form').dataset.edition = "pathfinder2remaster";
} else if (edition == "both") {
  document.getElementById('build-form').dataset.edition = "all";
} else if (window.location.pathname.match(/starfinder2/)) {
  document.getElementById('build-form').dataset.edition = 'starfinder2';
}

definePipe('editionName', (value) => {
  switch (value) {
    case 'pathfinder':
      return 'Pathfinder';
    case 'starfinder':
      return 'Starfinder';
    case 'pathfinder2':
      return 'Pathfinder 2e Legacy';
    case 'pathfinder2remaster':
      return 'Pathfinder 2e Remaster';
    case 'starfinder2':
      return 'Starfinder 2e';
    case 'all':
      return 'Both';
    default:
      return "";
  }
});
} catch (e) { 
  console.log("Error in BuildFormPathfinder2", e)
}
try {
on('#form-select-ancestry', 'form-select:ancestry', (evt) => {
  let detail = evt.detail;
  console.log('Form select: Ancestry', detail);
  set("#build-form", "ancestry", detail.value);
});
} catch (e) { 
  console.log("Error in Pathfinder2AncestryMenu", e)
}
try {
on('body', 'form-select:multiclass', (evt) => {
  let detail = evt.detail;
  let num = document.getElementById('build-form').dataset.multiclassNum;
  console.log('Form select: multiclass', detail);
  set('#build-form', `multiclass_${num}`, detail.value);
});

on('body', 'form-select:archetype', (evt) => {
  let detail = evt.detail;
  let num = document.getElementById('build-form').dataset.archetypeNum;
  console.log('Form select: archetype', detail);
  set('#build-form', `archetype_${num}`, detail.value);
});
} catch (e) { 
  console.log("Error in Pathfinder2ArchetypeMenu", e)
}
try {
on('#form-select-background', 'form-select:background', (evt) => {
  let detail = evt.detail;
  console.log('Form select: Background', detail);
  set("#build-form", "background", detail.value);
});
} catch (e) { 
  console.log("Error in Pathfinder2BackgroundMenu", e)
}
try {
on('#form-select-cls', 'form-select:cls', (evt) => {
  let detail = evt.detail;
  console.log('Form select: class', detail);
  set("#build-form", "cls", detail.value);

  let selects = detail.meta.selects;
  set("#build-form", "clsSelects", selects);
  // for (let btn of document.querySelectorAll(`button[data-id='${detail.value}']`)) {
  //   let selects = btn.dataset.selects;
  //   set("#build-form", "clsSelects", selects);
  //   break;
  // }
});
} catch (e) { 
  console.log("Error in Pathfinder2ClassMenu", e)
}
try {
on('body', 'form-select:heritage', (evt) => {
  let detail = evt.detail;
  console.log('Form select: Heritage', detail);
  set("#build-form", "heritage", detail.value);
});
} catch (e) { 
  console.log("Error in Pathfinder2HeritageMenu", e)
}
try {
on('body', 'form-select:subclass', (evt) => {
  let detail = evt.detail;
  console.log('Form select: Subclass', detail);
  let selectCode = toCamelCase(detail.select.replaceAll('/', '-'));
  set("#build-form", selectCode, detail.value);
});
} catch (e) { 
  console.log("Error in Pathfinder2SubclassMenu", e)
}
try {
on('.form-select-menu-options input[type=checkbox]', 'change', (evt) => {
  let checkbox = evt.target;
  let menu = checkbox.closest('.form-select-menu');

  let selectCode = menu.dataset.selectcode;
  let value = checkbox.dataset.value;
  setToggleInList("#build-form", selectCode, value, checkbox.checked);
});
} catch (e) { 
  console.log("Error in Pathfinder2SubclassOptionsMenu", e)
}
try {
on('.jump-link', 'click', (evt) => {
  let link = evt.target;
  let id = `jump--${link.dataset.zoom}`;
  // let scrollpane = link.closest('.scroll-pane');
  // scrollpane.scrollTo(0, top);
  document.getElementById(id).scrollIntoView();
});
} catch (e) { 
  console.log("Error in AssetMenu", e)
}
try {
let debug = getDebug('ImageDrop');
enableDebug('ImageDrop');

on(".image-drop", "dragover", (evt) => {
  evt.preventDefault();
  evt.stopPropagation();
  evt.target.classList.add('image-drop--ready');
  debug.log("Drag on");
});

on(".image-drop", "dragleave", (evt) => {
  evt.preventDefault();
  evt.stopPropagation();
  evt.target.classList.remove('image-drop--ready');
  debug.log("Drag off");
});

on(".image-drop", "drop", (evt) => {
  debug.log("Image dropped");

  // TODO check image size! 20MB limit
  // TODO encode the image
  // TODO send the image with the request
  
  evt.preventDefault();
  evt.stopPropagation();

  let imageDrop = evt.target;
  imageDrop.classList.remove('image-drop--ready');

  var files = evt.dataTransfer.files;
  if (files.length > 0) {
    var file = files[0];
    switch (file.type) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
        var reader = new FileReader();
        reader.onload = function(e) {
          var data = e.target.result;
          debug.log("I have data!");

          let input = imageDrop.querySelector('input');
          input.value = data;

          for (let img of imageDrop.querySelectorAll('img')) {
            img.src = data;
          }
        }
        reader.readAsDataURL(file);

        break;
    }
  }
});
} catch (e) { 
  console.log("Error in ImageDrop", e)
}
try {
on('.portrait-search-tools', 'change', (evt) => {
  let searchTools = evt.currentTarget;
  if (!searchTools.classList.contains('facet-search-tools')) {
    searchTools = searchTools.closest('.facet-search-tools');
  }

  let searchParams = {
    ancestry: '',
  };

  for (let facet of searchTools.querySelectorAll('.facet-select')) {
    let value = get(facet, 'value');
    if (facet.classList.contains('facet-ancestry')) {
      searchParams.ancestry = value;
    } else if (facet.classList.contains('facet-source')) {
      searchParams.source = value;
    } else if (facet.classList.contains('facet-rarity')) {
      searchParams.rarity = value;
    }
  }
  for (let searchBox of searchTools.querySelectorAll('.facet-search-box')) {
    searchParams.search = searchWords(searchBox.value);
  }

  let listId = searchTools.dataset.list;
  let list = document.getElementById(listId);
  updateItemList(list, searchParams);
});

function searchWords(str) {
  if (str === undefined || str === null || str == "") {
    return [];
  }
  let words = str.toLowerCase().split(' ');
  words = words.map((word) => word.trim());
  words = words.filter((word) => word != "");
  return words;
}
} catch (e) { 
  console.log("Error in PortraitSearchTools", e)
}
try {
all('.lazy', (lazy) => {
  on(lazy, 'reveal', (evt) => {
    componentLogger.log("Reveal lazy section");
  });
});
} catch (e) { 
  console.log("Error in Lazy", e)
}
try {
all('.picture--lazy', (picture) => {
  let img = picture.querySelector('img');
  respondToVisibility(picture, () => {
    img.src = img.dataset.src;
    delete img.dataset.src;
    picture.classList.remove('picture--lazy');
  });
});
} catch (e) { 
  console.log("Error in Picture", e)
}
try {
for (let block of document.getElementsByClassName('quote')) {
  let quote = quotes[Math.floor(Math.random() * quotes.length)];
  // console.log("Quote ready", quote);

  for (let text of block.getElementsByClassName('quote__text')) {
    text.textContent = quote.quote;
    text.classList.remove('quote--hidden');
    text.classList.add('quote__text--size_'+quote.size);
  }
  for (let cite of block.getElementsByClassName('quote__cite')) {
    cite.textContent = quote.author;
  }
}
} catch (e) { 
  console.log("Error in Quote", e)
}
try {
on('button[data-action="close"]', 'click', (event, btn) => {
  set('body', 'currentMenu', '');
});
} catch (e) { 
  console.log("Error in CloseButton", e)
}
try {
on('.reveal', 'reveal', (evt) => {
  let reveal = evt.target;
  
  reveal.classList.add('reveal--show');
});
on('.reveal', 'close', (evt) => {
  let reveal = evt.target;
  reveal.classList.hide('reveal--show');
})
} catch (e) { 
  console.log("Error in Reveal", e)
}
try {
// replace the Login button after page load if we're logged in
if (isLoggedIn()) {
  console.log("Logged in!");
}
} catch (e) { 
  console.log("Error in MenuButtons", e)
}
try {
on('aside.menu', 'close-menu', (event, elem) => {
  set('body', 'currentMenu', '');
});

on('#blanket', 'click', (event) => {
  set('body', 'currentMenu', '');
});
} catch (e) { 
  console.log("Error in SideMenu", e)
}
try {
on('.tab-bar__tab', 'click', (evt) => {
  let tab = evt.target;
  let tabCode = tab.dataset.tab;
  console.log("Selecting tab", tabCode);
  
  let tabBar = tab.closest('.tab-bar');
  set(tabBar, 'current', tabCode);
});
} catch (e) { 
  console.log("Error in TabBar", e)
}
});