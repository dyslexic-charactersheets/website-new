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

