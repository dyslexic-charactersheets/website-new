import { log, error } from '#src/log.js';
import { Document } from './Document.js';
import { has } from '../util.js';

export class GM {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
    this.gmPick = primary.attributes.gmPick;
  }

  option(name) {
    log("Character", "option", name, this.primary[name])
    return has(this.primary.attributes, name) && this.primary.attributes[name];
  }

  async create() {
    log("Character", "Create character sheet", this.primary);
    let doc = await Document.create(this.primary, this.attachments);

    if (this.option("permission")) {
      await doc.addPage(doc.gameData.getPage("permission"));
    }

    switch (this.gmPick) {
      case "characters":
        let partyPage = doc.gameData.getGMPage("characters", "party", this.primary.attributes.numPCs);
        await doc.addPage(partyPage);
        
        let characterPages = doc.gameData.getGMPagesExcept("characters", "party");
        for (let pageInfo of characterPages) {
          await doc.addPage(pageInfo);
        }
        break;
        
      case "campaign":
        let campaignPages = doc.gameData.getGMPages("campaign");
        for (let pageInfo of campaignPages) {
          await doc.addPage(pageInfo);
        }
        break;
        
      case "maps":
        let maps3d = this.primary.attributes.mapsView == "3d";
        let mapsPages = maps3d ? doc.gameData.data.gm.maps['3d'] : doc.gameData.data.gm.maps['2d'];
        for (let pageInfo of mapsPages) {
          await doc.addPage(pageInfo);
        }
        break;
        
      case "kingdom":
        let kingdomPage = doc.gameData.getGMPage("kingdom", "kingdom");
        await doc.addPage(kingdomPage);
        
        let settlementPage = doc.gameData.getGMPage("kingdom", "settlement", this.primary.attributes.settlementStyle);
        await doc.addPage(settlementPage);
        break;

      default:
        error("GM", "Unknown GM type!", this.gmPick);
        break;
    }
    
    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    switch(this.gmPick) {
      case "characters":
        return "NPCs";
      case "campaign":
        return "Campaign Planning";
      case "maps":
        return "Maps";
      case "kingdom":
        return "Kingdom Building";
    }
    return "GM.pdf";
  }
}
