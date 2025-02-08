import fs from 'fs';

import { isString, isArray, isObject, log, warn, error, has } from './util.js';
import { isatty } from 'tty';

export const languages = ['en', 'fr', 'es', 'de', 'pl'];
export const languageNames = {
    en: 'English',
    fr: 'Français',
    es: 'Espagnol',
    de: 'Deutsch',
    pl: 'Polskie'
};

let translationsFileContent = fs.readFileSync('data/translations.json', { encoding: 'utf8' });
let translations = JSON.parse(translationsFileContent);

export function translateObject(object, lang) {
  if (isArray(object)) {
    return object.map((obj) => translateObject(obj, lang));
  }

  if (has(object, lang)) {
    let subs = object[lang];
    for (let key of Object.keys(subs)) {
      object[key] = subs[key];
    }
  }
  return object;
}

export function translate(content, lang, attribs) {
  if (!isString(content)) {
    if (isArray(content)) {
      return content.map((item) => {
        return translate(item, lang, attribs);
      });
    }
    if (isObject(content)) {
      for (let key of Object.keys(content)) {
        content[key] = translate(content[key], lang, attribs);
      }
      return content;
    }
    error("i18n", "What am I even translating?".red, content, lang);
  }

  // lookup translations
  if (translations.hasOwnProperty(lang)) {
    if (content.match(/_\{.*\}/)) {
      content = content.replace(/_\{(.*?)\}/g, (match, part) => {
        let str = part;
        if (translations[lang].hasOwnProperty(str)) {
          str = translations[lang][str];
        }
        return str;
      });
    } else {
      if (translations[lang].hasOwnProperty(content)) {
        content = translations[lang][content];
      }
    }
  }

  // interpolate strings
  content = content.replace(/\{\{(.+?)\}\}/g, (match, number) => {
      number = parseInt(number);
      return attribs[number];
  });

  return content;
}

export function de_i18n(content) {
  if (isString(content)) {
    content = content.replace(/_\{(.+?)\}/g, (match, part) => {
      return part;
    });
  }

  if (isObject(content)) {
    let res = {...content};
    delete res.en;
    delete res.it;
    delete res.fr;
    delete res.es;
    delete res.pl;
    return res;
  }

  return content;
}
