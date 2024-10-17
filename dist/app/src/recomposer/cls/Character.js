import { log } from '#src/log.js';
import { Document } from './Document.js';
import { has } from '../util.js';


export class Character {
  constructor(primary, attachments) {
    this.primary = primary;
    this.attachments = attachments;
    log("Character", "Create character sheet", this.primary, this.attachments.length);
  }

  option(name) {
    log("Character", "option", name, this.primary[name])
    return has(this.primary.attributes, name) && this.primary.attributes[name];
  }

  async create() {
    let doc = await Document.create(this.primary, this.attachments);
    doc.classes = doc.gameData.getClassInfo(doc.settings.classes);
    this.classNames = doc.classes.map((cls) => cls.name);
    log("Character", "Character classes", doc.classes);

    if (this.option("permission")) {
      await doc.addPage(doc.gameData.getPage("permission"));
    }

    if (this.option("buildMyCharacter")) {
      await doc.addPage(doc.gameData.getPage("build"));
    }

    let classPages = doc.gameData.inferClassPages(this.primary, doc.gameData, doc.classes);
    doc.classPages = classPages;
    for (let pageInfo of classPages) {
      await doc.addPage(pageInfo);
    }

    if (this.option("optionBackground") || this.option("includeCharacterBackground")) {
      let pfs = this.option("isPathfinderSociety");
      await doc.addPage(doc.gameData.getPage("background", pfs ? "pathfindersociety" : null));
    }

    if (this.option("includeLycanthrope")) {
      await doc.addPage(doc.gameData.getPage("lycanthrope"));
    }

    if (this.option("includeIntelligentItem")) {
      await doc.addPage(doc.gameData.getPage("intelligent-item"));
    }

    if (this.option("includePartyFunds")) {
      await doc.addPage(doc.gameData.getPage("partyfunds"));
    }

    if (this.option("includeAnimalCompanion")) {
      await doc.addPage(doc.gameData.getPage("animalcompanion"));

      if (this.option("hasAnimalIconic")) {
        await doc.addPage(doc.gameData.getPage("mini-animal"));
      }
    }

    if (this.option("includeMini")) {
      await doc.addPage(doc.gameData.getPage("mini", this.primary.attributes.miniSize));
    }

    let bytes = await doc.finishDocument();
    return bytes;
  }

  filename() {
    // let classes = (has(this.primary.attributes, "classes") && Array.isArray(this.primary.attributes.classes)) ? this.primary.attributes.classes : [];

    log("Character", "Filename? Classes", this.classNames);

    if (this.classNames.length == 0) {
      return "Generic.pdf";
    }
    return this.classNames.join(", ")+".pdf";
  }
}
