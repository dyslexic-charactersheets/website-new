import { Document } from './Document.js';
import { log, error } from '#src/log.js';

export class Kingdom {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
  }

  async create() {
    log("Kingdom", "Create kingdom", this.primary);
    let doc = await Document.create(this.primary, this.attachments);
    
    if (this.primary.attributes.permission) {
      await doc.addPage(doc.gameData.getPage("permission"));
    }

    await doc.addPage(doc.gameData.getGMPage("kingdom", "kingdom"));

    let settlementStyle = this.primary.attributes.settlementStyle;
    await doc.addPage(doc.gameData.getGMPage("kingdom", "settlement", settlementStyle))

    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    return "Kingdom.pdf";
  }
}
