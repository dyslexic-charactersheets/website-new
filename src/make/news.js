import fs from 'fs';
import { slugify } from './make.js';

let newsFileContent = fs.readFileSync('data/news.json', { encoding: 'utf8' });
let news = JSON.parse(newsFileContent);

for (let article of news) {
    article.slug = slugify(article.title);
}

export function getNews() {
    return news;
}