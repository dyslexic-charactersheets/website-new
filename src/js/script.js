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

