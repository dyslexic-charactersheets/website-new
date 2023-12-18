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
