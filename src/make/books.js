function partition(array, check) {
    return array.reduce(([pass, fail], elem) => {
        return check(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    }, [[], []]);
}

// known sets
const rulebooks = [
    'advanced-players-guide',
    'secrets-of-magic',
    'guns-and-gears',
    'dark-archive',
];
const paizoProducts = [
    'lost-omens'
];
const paizoAdventures = [
    'age-of-ashes',
    'extinction-curse',
    'agents-of-edgewatch',
    'strength-of-thousands',
];

export function sortBooks(books, lang) {
    let sorted = [];
    [
        book => book.id == "core-rulebook", // Core Rulebook
        book => book.id == "advanced-players-guide",
        book => book.core, // other "core" items
        book => rulebooks.includes(book.id), // main rulebooks
        book => paizoProducts.includes(book.id) || book.id.match(/lost-omens/), // Paizo Products
        book => paizoAdventures.includes(book.id),
    ].forEach(check => {
        let [match, other] = partition(books, check);
        
        match = match.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        sorted = sorted.concat(match);
        books = other;
    });

    sorted = sorted.concat(books);

    return sorted;
}

export function book2tier(bookname) {
    bookname = bookname.replace(/_\{(.*)\}/g, '$1');

    switch (bookname) {
        case "Core Rulebook":
        case "Advanced Player's Guide":
        case "Secrets of Magic":
        case "Guns and Gears":
        case "Dark Archive":
        case "Gamemastery Guide":
            return "core";

        case "Lost Omens Ancestry Guide":
        case "Lost Omens Character Guide":
        case "Lost Omens World Guide":
        case "Lost Omens Legends":
        case "Lost Omens Gods and Magic":
        case "Lost Omens Pathfinder Society Guide":
        case "Absalom, City of Lost Omens":
        case "Lost Omens Grand Bazaar":
            return "lore"

        case "Pathfinder Beginner Box":
        case "Kingmaker":
        case "Age of Ashes":
        case "Extinction Curse":
        case "Agents of Edgewatch":
        case "Little Trouble in Big Absalom":
        case "Pathfinder Society":
            return "adventures";

        default:
            return "thirdparty";
    }
}

export function book2img(game, bookid) {
    switch (bookid) {
        case "absalom-city-of-lost-omens":
            return "pf2-lost-omens-absalom";

        default:
            return game+"-"+bookid;
    }
}