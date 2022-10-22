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