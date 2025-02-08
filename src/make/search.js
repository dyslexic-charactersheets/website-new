
export function createSearchIndex(languages) {
  let searchIndex = {
    languages,

    // add a category (ie a select) to the search index
    addCategory(category) {
      for (let language of languages) {
        if (!(category in searchIndex[language])) {
          searchIndex[language][category] = {};
        }
      }
    },

    // add an item to the index
    addItem(category, language, content, item) {
      let words = content.split(/ -/);
      for (let word of words) {
        if (!(word in searchIndex[language][category])) {
          searchIndex[language][category] = [];
        }
        searchIndex[language][category].push(item);
      }
    },
    finish() {
      return this;
    }
  }

  for (let language of languages) {
    searchIndex[language] = {};
  }

  return searchIndex
}
