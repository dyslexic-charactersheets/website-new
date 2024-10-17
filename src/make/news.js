import fs from 'fs';
import { slugify } from './util.js';

let newsFileContent = fs.readFileSync('data/news.json', { encoding: 'utf8' });
let news = JSON.parse(newsFileContent);

let dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
let shortMonthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' });
let yearFormat = new Intl.DateTimeFormat('en-GB', { year: 'numeric'});

for (let article of news) {
    article.slug = slugify(article.title);

    // format the date
    article.date = new Date(article.date);
    article.dayOfMonth = dayFormat.format(article.date);
    article.shortMonth = shortMonthFormat.format(article.date);
    article.dateYear = yearFormat.format(article.date);

    // format the file link
    if (article.file) {
        article.fileURL = '/files/'+article.file
    }

    // short version for the home page
    let body = article.body.split('\n', 1)[0];
    if (body.length > 200) {
      body = body.substr(0, 200);
      body.replace(/\.$/, '')+"...";
    }
    article.shortText = body;
}

news.sort((a, b) => a.date > b.date ? -1 : 1);

export function getNews() {
    return news;
}
