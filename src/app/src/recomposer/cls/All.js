import { log } from '#src/log.js';
import { Document } from './Document.js';

export class All {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
  }

  async create() {
    log("All", "Download all");
    let doc = await Document.create(this.primary, this.attachments);

    for (let page of doc.gameData.getAllPages()) {
      log("All", "Page", page);
      await doc.addPage(page);
    }
    
    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    log("All", "Filename");
    return "All.pdf";
  }
}
