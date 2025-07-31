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
