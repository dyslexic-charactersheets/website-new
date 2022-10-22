#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import fse from 'fs-extra';
import colors from 'colors';
import Handlebars from 'handlebars';
import HandlebarsHelpers from 'handlebars-helpers';
import Sass from 'sass';
// import {minify} from 'minify';
import minify from '@node-minify/core';
import gcc from '@node-minify/google-closure-compiler';
import crass from '@node-minify/crass';

import dyslexicCharacterSheets from 'dyslexic-charactersheets';
import { sortBooks, book2img, book2tier } from './books.js';
import { languages, languageNames, translate } from './i18n.js';
import { getNews } from './news.js'

// load all the game system data
let gameData = {
    "pathfinder2": null,
}
let pathfinder2promise = dyslexicCharacterSheets.getFormData("pathfinder2").then((data) => {
    gameData.pathfinder2 = data;
});

let allPromises = Promise.all([
    pathfinder2promise
]);

// init handlebars
var helpers = HandlebarsHelpers({
    handlebars: Handlebars
});


// General helpers

Handlebars.registerHelper('dump', function (obj) {
    return "<!-- "+JSON.stringify(obj, null, 2)+" -->";
});

export function slugify(str) {
    str = str.replace(/_\{(.*?)\}/, '$1');
    str = str.replace('\'', '');
    str = str.replace(/[^A-Za-z0-9]+/g, '-');
    str = str.replace(/^-+/, '');
    str = str.replace(/-+$/, '');
    str = str.toLowerCase();
    return str;
}

Handlebars.registerHelper('ifeq', function (term1, term2, options) {
    // console.log(" * ".yellow+"ifeq: ", term1, ",", term2, ",", options);
    if (term1 == term2) {
        return options.fn(this);
    } else if (options.reverse) {
        return options.reverse(this);
    }
});

Handlebars.registerHelper('nextSelect', function (next) {
    if (next.length > 0) {
        return next[0];
    }
    return "";
});


// Build stylesheet
console.log(" * ".green + "Compiling stylesheet");
let stylesheet = Sass.compile('scss/stylesheet.scss');
fs.writeFile('../dist/htdocs/style.css', stylesheet.css, (err) => {
    if (err) {
        console.log(" * Stylesheet ERROR ".red+err);
    } else {
        console.log(" * Stylesheet OK".green);
    }
});
// minify({
//     compressor: crass,
//     content: stylesheet.css,
// }).then((min) => {
//     fs.writeFile('../dist/htdocs/style.css', min, (err) => {
//         if (err) {
//             console.log(" * Stylesheet min ERROR ".red+err);
//         } else {
//             console.log(" * Stylesheet min OK".green);
//         }
//     });
// }).catch((err) => {
//     console.log(" * Stylesheet min ERROR".red+err);
// });

// Build script
console.log(" * ".green+"Compiling script");
let js = [
    'script',
    'build',
    'build-pathfinder2',
    'build-starfinder'
].map((name) => {
    let content = fs.readFileSync('js/'+name+'.js', { encoding: 'utf8' });
    return content;
}).join('\n');
fs.writeFile('../dist/htdocs/script.js', js, (err) => {
    if (err) {
        console.log(" * Script ERROR ".red+err);
    } else {
        console.log(" * Script OK".green);
    }
})
// minify({
//     compressor: gcc,
//     content: js,
// }).then((min) => {
//     fs.writeFile('../dist/htdocs/script.js', min, (err) => {
//         if (err) {
//             console.log(" * Script min ERROR ".red+err);
//         } else {
//             console.log(" * Script min OK".green);
//         }
//     });
// }).catch((err) => {
//     console.log(" * Script min ERROR".red+err);
// });


// Translations
// const languages = ['en', 'fr', 'es', 'de', 'pl'];
// const languageNames = {
//     en: 'English',
//     fr: 'Français',
//     es: 'Espagnol',
//     de: 'Deutsch',
//     pl: 'Polskie'
// };

// let translationsFileContent = fs.readFileSync('js/translations.json', { encoding: 'utf8' });
// let translations = JSON.parse(translationsFileContent);

Handlebars.registerHelper('__', function (content, ...attribs) {
    if (content === null || content === undefined) {
        console.log(" * Cannot translate nothing".red);
        return "";
    }
    if (!(typeof content === 'string' || content instanceof String)) {
        console.log(" * Cannot translate non-string".red, content);
        return "";
    }

    // find the current language
    let options = attribs[attribs.length - 1];
    let lang = options.data.root.lang;

    return translate(content, lang, attribs);
});

Handlebars.registerHelper('languagename', function (lang) {
    return languageNames[lang];
});

Handlebars.registerHelper('tolang', function (lang, page) {
    if (page == "index") {
        return '/'+lang+'/';
    } else {
        return '/'+lang+'/'+page+'.html';
    }
});

Handlebars.registerHelper('autop', function (content) {
    if (content === undefined || content === null) {
        console.log(" * autop: No content".red);
        return "";
    }
    let lines = content.split(/\n/);
    lines = lines.map((line) => line.trim());
    lines = lines.filter((line) => line != "");
    lines = lines.map((line) => "<p>"+line+"</p>");
    return lines.join("\n");
});


// Register layouts

console.log(" * ".green + "Registering layouts");

let layouts = fs.readdirSync('layouts');
for (let layout of layouts) {
    let name = layout.replace(/\.html\.hbs$/, '');
    console.log("   * ".green + name);
    let layoutBody = fs.readFileSync('layouts/'+layout, { encoding: 'utf8' });
    Handlebars.registerPartial(name, layoutBody);
}

console.log(" * ".green + "Registering partials");

let partials = fs.readdirSync('partials');
for (let partial of partials) {
    let name = partial.replace(/\.html\.hbs$/, '');
    console.log("   * ".green + name);
    let partialBody = fs.readFileSync('partials/'+partial, { encoding: 'utf8' });
    Handlebars.registerPartial(name, partialBody);
}


// Build pages

allPromises.then(() => {

    let pathfinder2data = gameData.pathfinder2;

    console.log(" * ".green + "Build pages");

    function getSelectValue(sel, key) {
        // console.log("   * ".blue+"Looking up value", key, sel.values);
        for (let val of sel.values) {
            if (val.code == key) {
                return val;
            }
        }
        return null;
    }

    // Take a select from the JSON with a list of values, and extract books and book groups
    function makeSelect(formData, name) {
        for (let sel of formData.selects) {
            if (sel.select == name) {
                    
                let tiers = {
                    "core": [],
                    "lore": [],
                    "adventures": [],
                    "thirdparty": []
                };

                // group the values into books and tiers
                for (let name in sel.groups) {

                    let id = slugify(name);
                    let img = book2img('pf2', id);
                    let tier = book2tier(name);

                    let book = {
                        id,
                        name,
                        img,
                        selected: false,
                    };
                    // console.log("   * Book: ".yellow, book);

                    let values = [];
                    for (let key of sel.groups[name]) {
                        let val = getSelectValue(sel, key);
                        if (val !== null) {
                            if (sel.select == 'ancestry') {
                                // console.log("   * ".green+"Checking ancestry:", key);
                                switch (key) {
                                    case 'gnome':
                                    case 'goblin':
                                    case 'halfling':
                                    case 'apg-kobold':
                                    case 'apg-ratfolk':
                                    case 'lost-omens-ancestry-guide-sprite':
                                    case 'lost-omens-character-guide-leshy':
                                    case 'lost-omens-grand-bazaar-poppet':
                                        val.small = true;
                                }
                            }
                            values.push(val);
                        }
                    }
                    book.values = values;
                    
                    tiers[tier].push(book);
                }

                for (let tier in tiers) {
                    tiers[tier] = sortBooks(tiers[tier]);
                }
                if (tiers.core.length > 0) {
                    tiers.core[0].selected = true;
                }
                sel.tiers = tiers;
                return sel;
            }
        }
        return null;
    }

    function findChildSelects(formData, parent) {
        let selects = new Set();
        for (let value of parent.values) {
            if (value.hasOwnProperty('selects')) {
                for (let select of value.selects) {
                    selects.add(select);
                }
            }
        }
        selects = [...selects];

        selects = selects.map((select) => {
            // console.log(" * ".blue+"Looking for sub-select", select);
            let sub = makeSelect(formData, select);
            // console.log("   * ".blue+"Sub-select", sub);
            return sub;
        });
        // console.log(selects);
        return selects;
    }

    function pf2data() {
        let ancestries = makeSelect(pathfinder2data, 'ancestry');
        let classes = makeSelect(pathfinder2data, 'class');
        let multiclass = makeSelect(pathfinder2data, 'multiclass');
        let archetypes = makeSelect(pathfinder2data, 'archetype');
        return {
            ancestries,
            // heritage: makeSelect('heritage'),
            heritageSelects: findChildSelects(pathfinder2data, ancestries),
            backgrounds: makeSelect(pathfinder2data, 'background'),
            classes,
            // subclassSelects: findChildSelects(pathfinder2data, classes),
            multiclass,
            // multiclassSelects: findChildSelects(pathfinder2data, multiclass),
            archetypes,
            // archetypeSelects: findChildSelects(pathfinder2data, archetypes),
        }
    }

    let templateOptions = {
        languages,
        currentYear: new Date().getFullYear(),
        data: pathfinder2data,
        news: getNews(),
        pf2: pf2data(),
    };
    
    let pages = fs.readdirSync('pages');
    for (let lang of languages) {
        fs.mkdir('../dist/htdocs/'+lang, {recursive: true}, (err) => {
            if (err) {
                console.log(" * Language mkdir ERROR ".red+err);
            }
        });
    
        for (let page of pages) {
            let name = page.replace(/\.html\.hbs$/, '');
            console.log("   * ".green+name+" ("+lang+")");
            let pageBody = fs.readFileSync('pages/'+page, { encoding: 'utf8' });
            let pageTemplate = Handlebars.compile(pageBody);
    
            let pageOptions = {
                lang,
                page: name,
                ...templateOptions
            }
            // console.log(" * ".yellow+"Page options:", pageOptions);
            let pageContent = pageTemplate(pageOptions);
            fs.writeFile('../dist/htdocs/'+lang+'/'+name+'.html', pageContent, (err) => {
                if (err) {
                    console.log(" * Page ERROR ".red+name+" ("+lang+"): "+err);
                } else {
                    console.log(" * Page OK ".green+name+" ("+lang+")");
                }
            })
        }
    }
});

// Copy static files
console.log(" * ".green + "Copying static files");
fse.copy('static', '../dist/htdocs', (err) => {
    if (err) {
        console.log(" * Static ERROR ".red+err);
    } else {
        console.log(" * ".green+"Static files copied");
    }
});