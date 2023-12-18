import fs from 'fs';

let quotesFileContent = fs.readFileSync('data/quotes.txt', { encoding: 'utf8' })
let lines = quotesFileContent.split(/\n/);
let quotes = lines.map(line => line.trim())
    .filter(line => line != "" && !line.match(/^--/) && line.match(/ --by-- /))
    .map(line => {
        var split = line.split(/ --by-- /);
        var quote = split[0];
        var author = split[1];
        var noteClass = (quote.length > 115) ? "long" : ( (quote.length > 50) ? "medium" : "short");

        return {
            size: noteClass,
            quote: quote,
            author: author
        }
    });

export function getQuotes() {
    return quotes;
}