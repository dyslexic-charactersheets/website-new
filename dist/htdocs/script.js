// Side menus
function showAside(name) {
    closeAside();
    let aside = document.getElementById(name);
    if (aside !== null) {
        aside.classList.add('aside--show');
    } else {
        for (let aside2 of document.querySelectorAll('aside[data-key="'+name+'"]')) {
            aside2.classList.add('aside--show');
        }
    }
    document.getElementById('blanket').classList.add('blanket--show');
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

for (let btn of document.getElementsByClassName('close-button')) {
    btn.addEventListener('click', closeAside);
}

document.getElementById('blanket').addEventListener('click', closeAside);




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


//  -- BUILD WIZARD --  //


// Slides

function shiftSlides(id, shift) {
    let slides = document.getElementById('slides-'+id);
    if (slides !== null) {
        slides.dataset.show = true;
        setTimeout(() => {
            let newSlide = parseInt(slides.dataset.slide) + parseInt(shift);
            slides.dataset.slide = newSlide;
            
            let milestones = document.getElementById('milestones-'+id);
            if (milestones !== null) {
                milestones.dataset.show = true;
                setTimeout(() => {
                    milestones.dataset.slide = newSlide;
                }, 1);
            }
        });
    }
}

function nextSlide(id) {
    shiftSlides(id, 1);
}

function showMilestones(id) {
    // milestones track
    for (let milestones of document.getElementsByClassName('nav--milestones')) {
        milestones.dataset.show = false;
    }
    let milestones = document.getElementById('milestones-'+id);
    if (milestones !== null) {
        milestones.dataset.show = true;
        setTimeout(() => {
            milestones.dataset.slide = 1;
        }, 1);
    }

    // slides
    for (let slides of document.getElementsByClassName('slides--v')) {
        slides.dataset.show = false;
    }
    let slides = document.getElementById('slides-'+id);
    if (slides !== null) {
        slides.dataset.show = true;
        setTimeout(() => {
            slides.dataset.slide = 1;
        }, 1);
    }

    // shiftSlides(1);
}

function setupSlidesButton(btn) {
    let slidesElem = btn.closest('.slides');
    btn.addEventListener('click', function () {
        let slide = btn.dataset.slide;
        slidesElem.dataset.slide = slide;
        
        for (let milestonesElem of document.getElementsByClassName('nav--milestones')) {
            milestonesElem.dataset.slide = slide;
        }
    });
}

for (let btn of document.getElementsByClassName('button-prev')) {
    setupSlidesButton(btn);
}
for (let btn of document.getElementsByClassName('button-next')) {
    setupSlidesButton(btn);
}
for (let btn of document.getElementsByClassName('button-jump')) {
    setupSlidesButton(btn);
}

// Build form
for (let output of document.getElementsByClassName('output--select')) {
    ((output) => {
        let id = output.dataset.select;
        output.addEventListener('click', (evt) => {
            showAside(id+'-menu');
        });
    })(output);
}

for (let btn of document.getElementsByClassName('button-add')) {
    ((btn) => {
        let id = btn.dataset.select;
        btn.addEventListener('click', (evt) => {
            showAside(id+'-menu');
        });
    })(btn);
}

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

for (let btn of document.getElementsByClassName('option')) {
    ((btn) => {
        let select = btn.dataset.select;
        let value = btn.dataset.value;
        let text = btn.dataset.text;
        let next = btn.dataset.next;
        btn.addEventListener('click', (evt) => {
            pickOption(select, value, text);
            closeAside();
            if (next !== null && next != "") {
                console.log("Next select:", next);
                showAside(next);
            }
        });
    })(btn);
}



// Colour fields
function setColourValue(id, hexcolour) {
    for (let input of document.getElementsByName(id)) {
        input.value = hexcolour;
        let output = input.closest('.colour-output');
        for (let inner of output.getElementsByClassName('colour-output__inner')) {
            inner.style.backgroundColor = hexcolour;
        }
    }
}

for (let output of document.getElementsByClassName('colour-output')) {
    ((output) => {
        let colourName = output.dataset.colourname;
        output.addEventListener('click', () => {
            showAside('colour-picker-'+colourName);
        });
    })(output);
}
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
}