import { Document } from './Document.js';

export class Starship {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
  }

  async create() {
    // log("Starship", "Create starship", this.primary);
    let doc = await Document.create(this.primary, this.attachments);
    
    if (this.primary.attributes.permission) {
      await doc.addPage(doc.gameData.getPage("permission"));
    }
    
    // starship pages
    let clsInfo = doc.gameData.getClassInfo({class: "Starship"});
    for (let page of clsInfo.pages) {
      let pageInfo = doc.gameData.getPage(page);
      await doc.addPage(pageInfo);
    }

    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    return "Starship.pdf";
  }
}
