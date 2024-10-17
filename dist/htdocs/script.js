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
function generateId() {
  return Math.floor(Math.random() * 10000000000).toString(16);
}

function isLoggedIn() {
  // TODO login
  return false;
}
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
let debug = getDebug('signals');

let commandFunctions = {};

function defineCommand(command, func) {
  commandFunctions[command] = func;
}

function doCommands(commands, element) {
  if (commands === undefined || commands === null || commands.length == 0) {
    return;
  }

  // do the command
  let command = commands.shift();
  console.log("Command:", command);
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
        if (has(commandFunctions, command)) {
          commandFunctions[command]();
        }
        console.log("Unknown command:", command);
        break;
    }
  }

  // let the DOM catch up before we do the next command
  setTimeout(() => doCommands(commands, element), 5);
}


// dispatch a new event (or several, separated by a comma) on a target element
function emit(target, signal, args, event) {
  console.log("Emit", target, signal, args);
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
    console.log("  Emit: event", evt);
    target.dispatchEvent(evt);
  }
}
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
  }

  let xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  // xhr.setRequestHeader('X-CSRFToken', csrftoken);
  xhr.setRequestHeader('Content-Type', 'application/javascript');
  xhr.responseType = 'blob';

  xhr.onload = function (e) {
    let blob = e.currentTarget.response;
    let fileName = 'file.html';
    let contentDispo = e.currentTarget.getResponseHeader('Content-Disposition');
    if (contentDispo) {
      fileName = contentDispo.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
      if (fileName.startsWith('"') && fileName.endsWith('"')) {
        fileName = fileName.substring(1, fileName.length - 1);
      }
    }
    
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.dispatchEvent(new MouseEvent('click'));
  }
  xhr.send(doc);
  
  downloadDisabled = false;
}
function readClassicFormAndSubmit(type) {
  console.log("Download");
  
  let request = readClassicForm(type);
  if (isLoggedIn()) {
    saveCharacter(request);
  }
  downloadCharacterSheet(request);
}

function readCheckbox(name) {
  let checked = false;
  for (let checkbox of document.getElementsByName(name)) {
    if (checkbox.checked) {
      checked = true;
    }
  }
  return checked;
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
};
addEventListener('load', () => {
  try {
on("input[type='checkbox']", "change", (evt) => {
  let checkbox = evt.target;
  if (checkbox.dataset.var) {
    set("#build-form", checkbox.dataset.var, checkbox.checked);
  }
});
} catch (e) { 
  console.log("Error in Checkbox", e)
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
window.dataArchive = {};

all('data', (dataElem) => {
  let id = dataElem.id;
  let data = JSON.parse(dataElem.dataset.value);
  let key = dataElem.dataset.key;

  let dataByKey = {};
  for (let item of data) {
    dataByKey[item[key]] = item;
  }

  window.dataArchive[id] = dataByKey;
});
} catch (e) { 
  console.log("Error in Data", e)
}
try {
on("input[type='search']", "change", (evt) => {
  console.log("Search");
});

all('.form-select-menu', (menu) => {
  let menuId = menu.id;
  let fieldCode = menu.dataset.code;

  on(menu, 'form-select', (evt) => {
    let detail = evt.detail;
    console.log("Form select", menuId, detail, evt);
    emit(menu, 'form-select:'+fieldCode, detail, evt);
  })
});
} catch (e) { 
  console.log("Error in FormSelectMenu", e)
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
on(".page-option input[type=checkbox]", "change", (evt) => {
  let checkbox = evt.target;
  set("#build-form", checkbox.name, checkbox.checked);
});
on(".page-option input[type=radio]", "change", (evt) => {
  // let radio = evt.target;
  // set("#build-form", radio.name, value);
});
} catch (e) { 
  console.log("Error in PageOption", e)
}
try {
const urlParams = new URLSearchParams(window.location.search);
const edition = urlParams.get('edition');
if (edition == "legacy") {
  document.getElementById('build-form').dataset.edition = "pf2-legacy";
} else if (edition == "remaster") {
  document.getElementById('build-form').dataset.edition = "pf2-remaster";
} else if (edition == "both") {
  document.getElementById('build-form').dataset.edition = "all";
} else if (window.location.pathname.match(/starfinder2/)) {
  document.getElementById('build-form').dataset.edition = 'sf2';
}

definePipe('editionName', (value) => {
  switch (value) {
    case 'pathfinder':
      return 'Pathfinder';
    case 'starfinder':
      return 'Starfinder';
    case 'pf2-legacy':
      return 'Pathfinder 2e Legacy';
    case 'pf2-remaster':
      return 'Pathfinder 2e Remaster';
    case 'sf2':
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
// on()
on('.dyslexic-preset-button', 'click', (evt) => {
  console.log("Dyslexic preset");
  
  // set('#build-form', );
  set('#build-form', 'baseColour', 'blue2');
  set('#build-form', 'accentColour', 'magenta');
  set('#build-form', 'pageBackground', 'magnolia');
  set('#build-form', 'underlay', false);
  set('#build-form', 'colourful', true);
});
} catch (e) { 
  console.log("Error in BuildFormPF2_AppearanceSlide", e)
}
try {
on('.button-download', 'click', (evt) => {

});
} catch (e) { 
  console.log("Error in BuildFormPF2_DownloadSlide", e)
}
try {
on('#form-select-ancestry', 'form-select:ancestry', (evt) => {
  let detail = evt.detail;
  console.log('Form select: Ancestry', detail);
  set("#build-form", "ancestry", detail);
});

definePipe('ancestryName', (value) => {
  console.log("Ancestry name", value);
  
  if (window.dataArchive['pathfinder2.ancestry'].hasOwnProperty(value)) {
    return window.dataArchive['pathfinder2.ancestry'][value].name;
  }
  
  return "";
});
} catch (e) { 
  console.log("Error in Pathfinder2AncestryMenu", e)
}
try {
on('#form-select-background', 'form-select:background', (evt) => {
    let detail = evt.detail;
    console.log('Form select: Background', detail);
    set("#build-form", "background", detail);
  });
  
  definePipe('backgroundName', (value) => {
    console.log("Background name", value);
    
    if (window.dataArchive['pathfinder2.background'].hasOwnProperty(value)) {
      return window.dataArchive['pathfinder2.background'][value].name;
    }
    
    return "";
  });
} catch (e) { 
  console.log("Error in Pathfinder2BackgroundMenu", e)
}
try {
on('#form-select-class', 'form-select:class', (evt) => {
  let detail = evt.detail;
  console.log('Form select: class', detail);
  set("#build-form", "class", detail);
});

definePipe('className', (value) => {
  console.log("class name", value);
  
  if (window.dataArchive['pathfinder2.class'].hasOwnProperty(value)) {
    return window.dataArchive['pathfinder2.class'][value].name;
  }
  
  return "";
});
} catch (e) { 
  console.log("Error in Pathfinder2ClassMenu", e)
}
try {
// on('#form-select-', 'form-select:ancestry', (evt) => {
//   let detail = evt.detail;
//   console.log('Form select: Ancestry', detail);
//   set("#build-form", "ancestry", detail);
// });

definePipe('heritageName', (value) => {
  if (value === null || value === undefined || value == "null" || value == "undefined") {
    return "";
  }
  console.log("Heritage name", value);
  
  if (window.dataArchive['pathfinder2.heritage'].hasOwnProperty(value)) {
    return window.dataArchive['pathfinder2.heritage'][value].name;
  }
  
  return "";
});
} catch (e) { 
  console.log("Error in Pathfinder2HeritageMenu", e)
}
try {
on('.repeatable__more', 'click', (evt) => {
  let repeatable = evt.target.closest('.repeatable');
  let visible = repeatable.dataset.visible;
  for (let instance of repeatable.querySelectorAll('.repeatable__instance')) {
    if (instance.dataset.instance == visible) {
      instance.classList.add('repeatable__instance--visible');
    }
  }
  repeatable.dataset.visible = 1 + parseInt(visible);
});
} catch (e) { 
  console.log("Error in Repeatable", e)
}
try {
let debug = getDebug('Slideshow');
enableDebug('Slideshow');

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
        debug.log("Auto next slide");
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
    debug.log("snapScroll");
    let jumpto = slideshow.dataset.jump;
    debug.warn("Jump to slide", jumpto);

    let scrollStart = isVertical ? slideshow.scrollTop : slideshow.scrollLeft;
    let scrollEnd = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth);

    let slideElem = slideshow.querySelector('.slide[data-jump="'+jumpto+'"]');
    let slideStart = isVertical ? slideElem.offsetTop : slideElem.offsetLeft;
    let slideMiddle = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth) / 2;
    let slideEnd = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth);

    // snap the scroll position
    if (scrollStart < slideStart) {
      debug.log("  Scrolling to", jumpto, "at", slideStart);
      if (isVertical) {
        slideshow.scrollTo(0, slideStart - slideshow.offsetTop);
      } else {
        slideshow.scrollTo(slideStart - slideshow.offsetLeft, 0);
      }
    } else if (scrollEnd > slideEnd) {
      debug.log("  Scrolling to end of", jumpto);
      if (isVertical) {
        let to = slideEnd - slideshow.offsetHeight;
        debug.log("    ", slideEnd, "-", slideshow.offsetHeight, "=", to);
        if (to < slideStart) {
          debug.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        debug.log("    Bottom", to);
        slideshow.scrollTo(0, to - slideshow.offsetTop);
      } else {
        let to = slideEnd - slideshow.offsetWidth;
        debug.log("    ", slideEnd, "-", slideshow.offsetWidth, "=", to);
        if (to < slideStart) {
          debug.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        debug.log("    Right", to);
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
    debug.log("endScroll");
    clearTimeout(scrollTimeout);
    let oldSlide = slideshow.dataset.jump;

    let scrollStart = isVertical ? (slideshow.scrollTop + slideshow.offsetTop) : (slideshow.scrollLeft + slideshow.offsetLeft);
    let scrollMiddle = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth) / 2;
    debug.log(`Finished scroll ${scrollStart} ${scrollMiddle}`);

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
      debug.log(`  Slide '${slide}' range ${slideStart} ${slideEnd}`);
      if (slideEnd > slideStart && scrollMiddle >= slideStart && scrollMiddle <= slideEnd) {
        let distance = Math.abs(scrollMiddle - slideMiddle);
        debug.log(`    Slide middle ${slideMiddle} distance ${distance}`);
        if (distance < smallestdistance) {
          smallestdistance = distance;
          newSlide = slide;
        }
      }
    }
    
    // snap to it
    debug.warn("Finished on slide", newSlide);
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
    debug.log("Prev slide");
    if (isVertical) {
      let to = slideshow.scrollTop - slideshow.clientHeight;
      slideshow.scrollTo(0, to);
    } else {
      let to = slideshow.scrollLeft - slideshow.clientWidth;
      slideshow.scrollTo(to, 0);
    }
  });

  on(slideshow, 'next-slide', (evt) => {
    debug.log("Next slide");
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
on('aside.menu', 'close-menu', (event, elem) => {
  set('body', 'currentMenu', '');
});

on('#blanket', 'click', (event) => {
  set('body', 'currentMenu', '');
});
} catch (e) { 
  console.log("Error in SideMenu", e)
}
});