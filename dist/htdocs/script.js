/*
// Side menus
function showAside(name) {
    closeAside();
    let aside = document.getElementById(name);
    if (aside !== null) {
        aside.classList.add('aside--show');
        document.getElementById('blanket').classList.add('blanket--show');
    } else {
        for (let aside2 of document.querySelectorAll('aside[data-key="'+name+'"]')) {
            aside2.classList.add('aside--show');
            document.getElementById('blanket').classList.add('blanket--show');
        }
    }
}

function closeAside() {
    for (let aside of document.getElementsByTagName('aside')) {
        aside.classList.remove('aside--show');
    }
    document.getElementById('blanket').classList.remove('blanket--show');
}

function setupMenu(button, aside) {
    for (let btn of document.getElementsByClassName(button)) {
        btn.addEventListener('click', () => {
            showAside(aside);
        });
    }
}

setupMenu('menu-button', 'main-menu');
setupMenu('language-button', 'language-menu');
setupMenu('login-button', 'login-menu');
setupMenu('button-contact', 'contact-menu');

document.getElementById('blanket').addEventListener('click', closeAside);
*/

// Key interaction
document.addEventListener('keydown', (evt) => {
    switch (evt.key) {
        case 'PageUp':
            shiftSlides(-1);
            break;

        case 'PageDown':
            shiftSlides(1);
            break;
    }
});


// Swap options

function swap(area, id) {
    if (area === null || area === "" || id === null || id === "") {
        return;
    }
    let swapArea = document.getElementById('swap-area:'+area);
    if (swapArea === null) {
        return;
    }
    for (let swapOption of swapArea.getElementsByClassName('swap-option')) {
        swapOption.classList.remove('swap-option--show');
    }
    let selectedOption = document.getElementById('swap-option:'+area+':'+id);
    if (selectedOption != null) {
        selectedOption.classList.add('swap-option--show');
    }
}

function swapDefault(area) {
    swap(area, 'default');
}
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
function doCommands(commands, element) {
  if (commands === undefined || commands === null || commands.length == 0) {
    return;
  }

  // do the command
  let command = commands.shift();
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
        if (has(bindFunctions, command)) {
          bindFunctions[command]();
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


// Build form
// for (let output of document.getElementsByClassName('output--select')) {
//     ((output) => {
//         let selectKey = output.dataset.select;
//         output.addEventListener('click', (evt) => {
//             showAside(selectKey);
//         });
//     })(output);
// }

// for (let btn of document.getElementsByClassName('button-add')) {
//     ((btn) => {
//         let id = btn.dataset.select;
//         btn.addEventListener('click', (evt) => {
//             showAside(id+'-menu');
//         });
//     })(btn);
// }

// Tabs
function showTab(tabset, name) {
    // highlight the tab
    for (let tab of document.querySelectorAll('.tab[data-set="'+tabset+'"]')) {
        tab.classList.remove('tab--selected');
    }
    for (let tab of document.querySelectorAll('.tab[data-set="'+tabset+'"][data-name="'+name+'"]')) {
        tab.classList.add('tab--selected');
    }

    // show the pane
    for (let pane of document.querySelectorAll('.tab-pane[data-set="'+tabset+'"]')) {
        pane.classList.remove('tab-pane--selected');
    }
    for (let pane of document.querySelectorAll('.tab-pane[data-set="'+tabset+'"][data-name="'+name+'"]')) {
        pane.classList.add('tab-pane--selected');
    }
}

for (let tab of document.getElementsByClassName('tab')) {
    ((tab) => {
        let tabset = tab.dataset.set;
        let name = tab.dataset.name;
        tab.addEventListener('click', (evt) => {
            showTab(tabset, name);
        });
    })(tab);
}


// Selects
function pickOption(select, value, text) {
    for (let input of document.querySelectorAll('input[data-select="'+select+'"]')) {
        input.value = value;
    }

    for (let output of document.querySelectorAll('output[data-select="'+select+'"]')) {
        output.innerText = text;
    }
}

// Lists
function addToList(listArea, value, text, subitem) {
    if (listArea === null || listArea == "") {
        return;
    }
    let area = document.getElementById('list-area:'+listArea);
    if (area == null) {
        return;
    }
    
    for (let template of area.getElementsByClassName('list-item-template')) {
        let listItem = document.createElement('div');
        listItem.classList.add("list-item");
        listItem.id = "list-item:"+listArea+":"+value;
        listItem.dataset.value = value;
        listItem.innerHTML = template.innerHTML;

        // adjust the list item
        for (let span of listItem.getElementsByClassName('list-item-name')) {
            span.textContent = text;
        }
        if (subitem === null || subitem == "") {
            for (let subitem of listItem.getElementsByClassName('list-item-subitem')) {
                subitem.remove();
            }
        }

        // put it in the list
        area.appendChild(listItem);

        for (let removeButton of listItem.getElementsByClassName('list-item-remove')) {
            ((value) => {
                removeButton.addEventListener('click', (evt) => {
                    removeFromList(listArea, value);
                });
            })(value);
        }
    }
}

function removeFromList(listArea, value) {
    let listItem = document.getElementById("list-item:"+listArea+":"+value);
    if (listItem !== null) {
        listItem.remove();
    }
}

for (let btn of document.getElementsByClassName('option')) {
    ((btn) => {
        let select = btn.dataset.select;
        let value = btn.dataset.value;
        let text = btn.dataset.text;
        let next = btn.dataset.next;
        let listArea = btn.dataset.listArea;
        let swapArea = btn.dataset.swapArea;
        let swapValue = btn.dataset.swap;
        btn.addEventListener('click', (evt) => {
            pickOption(select, value, text);
            closeAside();
            setTimeout(() => {
                if (next !== null && next != "") {
                    console.log("Next select:", next);
                    // showAside(next);
                }
            }, 0);
            swap(swapArea, swapValue);
            addToList(listArea, value, text, next);
        });
    })(btn);
}


// Page options

for (let pageOption of document.getElementsByClassName('page-option')) {
    ((pageOption) => {
        let optionName = pageOption.dataset.name;
        for (let input of pageOption.getElementsByTagName('input')) {
            for (let img of pageOption.getElementsByTagName('img')) {
                img.addEventListener('click', () => {
                    input.checked = !input.checked;
                    if (input.checked) {
                        pageOption.classList.add('page-option--selected');
                    } else {
                        pageOption.classList.remove('page-option--selected');
                    }
                });

                input.addEventListener('change', () => {
                    if (input.checked) {
                        pageOption.classList.add('page-option--selected');
                    } else {
                        pageOption.classList.remove('page-option--selected');
                    }
                }); 
            }
        }
    })(pageOption);
}


// Colour fields
// function setColourValue(id, hexcolour) {
//     for (let input of document.getElementsByName(id)) {
//         input.value = hexcolour;
//         let output = input.closest('.colour-output');
//         for (let inner of output.getElementsByClassName('colour-output__inner')) {
//             inner.style.backgroundColor = hexcolour;
//         }
//     }
// }

// for (let output of document.getElementsByClassName('colour-output')) {
//     ((output) => {
//         let colourName = output.dataset.colourname;
//         output.addEventListener('click', () => {
//             showAside('colour-picker-'+colourName);
//         });
//     })(output);
// }
// navigation
for (let btn of document.getElementsByClassName('pick-single')) {
    btn.addEventListener('click', () => showMilestones('character'));
}


for (let btn of document.getElementsByClassName('pick-gm')) {
    btn.addEventListener('click', () => showMilestones('gm'));
}

for (let btn of document.getElementsByClassName('pick-gm-npc')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'npc');
        nextSlide('gm');
    });
}

for (let btn of document.getElementsByClassName('pick-gm-maps')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'maps');
        nextSlide('gm');
    });
}

for (let btn of document.getElementsByClassName('pick-gm-kingdom')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'kingdom');
        nextSlide('gm');
    });
}

// go!
function submitCharacter() {

}
for (let btn of document.getElementsByClassName('pick-single')) {
    btn.addEventListener('click', () => showMilestones('character'));
}

for (let btn of document.getElementsByClassName('pick-starship')) {
    btn.addEventListener('click', () => showMilestones('starship'));
}

for (let btn of document.getElementsByClassName('pick-gm')) {
    btn.addEventListener('click', () => showMilestones('gm'));
}

for (let btn of document.getElementsByClassName('pick-gm-npc')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'npc');
        nextSlide('gm');
    });
}

for (let btn of document.getElementsByClassName('pick-gm-maps')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'maps');
        nextSlide('gm');
    });
}

for (let btn of document.getElementsByClassName('pick-gm-kingdom')) {
    btn.addEventListener('click', () => {
        showTab('gm', 'kingdom');
        nextSlide('gm');
    });
};
addEventListener('load', () => {
  try {
on(".image-drop", "drop", (evt) => {
  console.log("Image dropped");
});
} catch (e) { 
  console.log("Error in ImageDrop", e)
}
try {
all('.nav--milestones', (nav) => {
  function updateMilestones() {
    for (let milestone of nav.getElementsByClassName('nav--milestones__milestone')) {
      milestone.dataset.pick = milestone.dataset.milestone == nav.dataset.current;
    }
  }

  watch(nav, 'data-current', updateMilestones);
  updateMilestones();
});

on('.nav--milestones button','click', (evt) => {
  
});
} catch (e) { 
  console.log("Error in Milestones", e)
}
try {
// on('output[on-click]','click', (evt) => {
//   let onClick = 
// });
} catch (e) { 
  console.log("Error in Output", e)
}
try {
// on('button[data-action="prev"]', 'click', (event, button) => {
//   emit(button, 'prev-slide', event);
// });

// on('button[data-action="next"]', 'click', (event, button) => {
//   emit(button, 'next-slide', event);
// });
} catch (e) { 
  console.log("Error in Slide", e)
}
try {
all('.slideshow', (slideshow) => {
  const isVertical = slideshow.classList.contains('slideshow--v');
  const slides = JSON.parse(slideshow.dataset.slides);

  function snapScroll() {
    let jumpto = slideshow.dataset.jump;
    // console.log("Jump to slide", jumpto);

    let scrollStart = isVertical ? slideshow.scrollTop : slideshow.scrollLeft;
    let scrollEnd = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth);

    let slideElem = slideshow.querySelector('.slide[data-jump="'+jumpto+'"]');
    let slideStart = isVertical ? slideElem.offsetTop : slideElem.offsetLeft;
    let slideMiddle = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth) / 2;
    let slideEnd = slideStart + (isVertical ? slideElem.scrollHeight : slideElem.scrollWidth);

    if (scrollStart < slideStart) {
      // console.log("  Scrolling to top of", jumpto);
      if (isVertical) {
        slideshow.scrollTo(0, slideStart);
      } else {
        slideshow.scrollTo(slideStart, 0);
      }
    } else if (scrollEnd > slideEnd) {
      // console.log("  Scrolling to end of", jumpto);
      if (isVertical) {
        let to = slideEnd - slideshow.offsetHeight;
        // console.log("    ", slideEnd, "-", slideshow.innerHeight, "=", to);
        if (to < slideStart) {
          // console.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        // console.log("    Bottom", to);
        slideshow.scrollTo(0, to);
      } else {
        let to = slideEnd - slideshow.offsetWidth;
        // console.log("    ", slideEnd, "-", slideshow.innerHeight, "=", to);
        if (to < slideStart) {
          // console.log("    Adjusting!", to, "<", slideStart);
          to = slideStart;
        }
        // console.log("    Right", to);
        slideshow.scrollTo(to, 0);
      }
    }
  }

  watch(slideshow, 'data-jump', snapScroll);

  // Scroll behaviour
  let scrollTimeout = null;
  function endScroll() {
    clearTimeout(scrollTimeout);
    let oldSlide = slideshow.dataset.jump;

    let scrollStart = isVertical ? slideshow.scrollTop : slideshow.scrollLeft;
    let scrollMiddle = scrollStart + (isVertical ? slideshow.clientHeight : slideshow.clientWidth) / 2;
    // console.log(`Finished scroll ${scrollStart} ${scrollMiddle}`);

    // find the landing slide
    let newSlide = slides[0];

    let smallestdistance = 100000;
    for (let slide of slides) {
      let slideElem = slideshow.querySelector('.slide[data-jump="'+slide+'"]');

      // skip invisible slides
      if (!slideElem.offsetParent === null) {
        continue;
      }

      let slideStart = isVertical ? slideElem.offsetTop : slideElem.offsetLeft;
      let slideMiddle = slideStart + (isVertical ? slideElem.clientHeight : slideElem.clientWidth) / 2;
      let slideEnd = slideStart + (isVertical ? slideElem.clientHeight : slideElem.clientWidth);
      // console.log(`  Slide ${slideElem.dataset.jump} range ${slideStart} ${slideEnd}`);
      if (scrollMiddle >= slideStart && scrollMiddle <= slideEnd) {
        let distance = Math.abs(scrollMiddle - slideMiddle);
        // console.log(`    Distance ${slideMiddle} ${distance}`);
        if (distance < smallestdistance) {
          smallestdistance = distance;
          newSlide = slide;
        }
      }
    }
    
    // snap to it
    // console.log("Finished on slide", newSlide);
    slideshow.dataset.jump = newSlide;
  }

  on(slideshow, 'scroll', (evt) => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(endScroll, 200);
  });

  // Buttons
  on(slideshow, 'prev-slide', (evt) => {
    if (isVertical) {
      let to = slideshow.scrollTop - slideshow.clientHeight;
      slideshow.scrollTo(0, to);
    } else {
      let to = slideshow.scrollLeft - slideshow.clientWidth;
      slideshow.scrollTo(to, 0);
    }
  });

  on(slideshow, 'next-slide', (evt) => {
    if (isVertical) {
      let to = slideshow.scrollTop + slideshow.clientHeight;
      slideshow.scrollTo(0, to);
    } else {
      let to = slideshow.scrollLeft + slideshow.clientWidth;
      slideshow.scrollTo(to, 0);
    }
  });

  on(slideshow, 'jump-to-slide', (evt) => {
    slideshow.dataset.jump = '';
  });
});
} catch (e) { 
  console.log("Error in Slideshow", e)
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
definePipe('editionName', (value) => {
  // console.log("Edition name", value);
  switch (value) {
    case 'pathfinder':
      return 'Pathfinder'
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
on('button[data-action="close"]', 'click', (event, btn) => {
  set('body', 'currentMenu', '');
});
} catch (e) { 
  console.log("Error in CloseButton", e)
}
try {
// const blanket = document.getElementById('blanket');

// function hideMenus() {
//   for (let menu of document.getElementsByClassName('menu')) {
//     menu.dataset.show = false;
//   }
//   blanket.dataset.show = false;
// }

// on('aside.menu', 'show-menu', (event, elem) => {
//   hideMenus();
//   elem.dataset.show = true;
//   blanket.dataset.show = true;
// });

// on('aside.menu', 'close-menu', (event, elem) => {
//   elem.dataset.show = false;
//   blanket.dataset.show = false;
// });

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