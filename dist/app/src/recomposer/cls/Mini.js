/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

import { Document } from './Document.js';

export class Mini {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
  }

  async create() {
    // log("re:Mini", "Create mini", this.primary);
    let doc = await Document.create(this.primary, this.attachments);
    
    if (this.primary.attributes.permission) {
      await doc.addPage(doc.gameData.getPage("permission"));
    }
    
    let miniSize = this.primary.attributes.miniSize;
    await doc.addPage(doc.gameData.getPage("mini", miniSize));

    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    return "Mini.pdf";
  }
}
