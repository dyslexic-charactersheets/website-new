import { readFileSync } from 'fs';

import { BlendMode, PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { loadAppAsset } from '../assets.js';
import { getGameData, inferSettings, locatePage } from './GameData.js';
import { writeSkills } from '../skills.js';
import { writeCopyright } from '../copyright.js';
import { log, error } from '#src/log.js';
import { writeLogo, writePortrait } from '../pictures.js';
import { writeWatermark } from '../watermark.js';
import { has, isArray, isEmpty, isObject } from '../util.js';

export class Document {
  // Constructor cannot be async, so use this method instead
  static async create(primary, attachments) {
    let doc = new Document();
    doc.attachments = isArray(attachments) ? attachments : [];
    log("Document", "Found", doc.attachments.length, "attachments");

    await doc.setup(primary);
    return doc;
  }

  async setup(primary) {
    // core data
    this.primary = primary;
    this.settings = inferSettings(primary);
    this.gameData = getGameData(this.settings.game);
    if (isEmpty(this.gameData)) {
      error("GameData", "No game data", primary.attributes.game);
    }

    // create a document
    this.document = await PDFDocument.create();

    // embed fonts
    this.document.registerFontkit(fontkit)
    this.textFont = await this.addFont('Roboto-Condensed.ttf');
    this.textFontBold = await this.addFont('Roboto-BoldCondensed.ttf');
    
    if (this.settings.isStarfinder) {
      this.altFont = await this.addFont('Exo2-Bold.otf');
    } else {
      this.altFont = await this.addFont('Merriweather-Bold.ttf');
    }

    if (this.settings.isBarbarian) {
      this.barbarianFont = await this.addFont('dirty-duo.ttf');
    }

    // set up colours
    this.textColour = rgb(0.4, 0.4, 0.4);
    this.fillColour = rgb(0.6, 0.6, 0.6);
    this.white = rgb(1, 1, 1);
    this.back = rgb(0,0,0);
  }

  async addFont(filename) {
    log("Document", "Loading font:", filename);
    let data = loadAppAsset(`fonts/${filename}`);
    let font = await this.document.embedFont(data);
    return font;
  }

  getAttachment(attachmentId) {
    if (isObject(attachmentId)) {
      let type = attachmentId.type;
      let id = attachmentId.id;
      // log("Document", "Looking for attachment", type, id);
      
      for (let attachment of this.attachments) {
        // log("Document", " - Comparing", attachment.type, attachment.id);
        if (attachment.type == type && attachment.id == id) {
          // log("Document", "Found attachment", type, id);
          return attachment;
        }
      }
    } else {
      log("Document", "Looking for attachment", attachmentId);
      for (let attachment of this.attachments) {
        if (attachment.id == attachmentId) {
          // log("Document", "Found attachment", type, id);
          return attachment;
        }
      }
    }
    log("Document", "No attachment", attachmentId);
    return null;
  }

  async addPage(pageInfo) {
    try {
      if (isEmpty(pageInfo)) {
        error("Document", "No page");
        return;
      }
      if (pageInfo.slot == "fighter-maths") {
        // skipping fighter maths
        return;
      }
      let pageFile = locatePage(pageInfo, this.settings);
      if (isEmpty(pageFile)) {
        error("Document", "Unknown page", pageInfo, pageFile);
        return;
      }

      log("Document", "Page", pageInfo);
      const inDocBytes = readFileSync(pageFile);
      
      let [inPage] = await this.document.embedPdf(inDocBytes);
      let inPageDims = inPage.scale(1);
      this.pageDims = inPageDims;
      // log("Document", "Page dimensions", pageInfo, inPageDims);
      
      this.canvas = this.document.addPage([inPageDims.width, inPageDims.height]);

      // fill in the backdrop with white
      this.canvas.drawRectangle({
        x: 0, y: 0,
        width: inPageDims.width,
        height: inPageDims.height,
        color: rgb(1, 1, 1)
      });

      // draw the actual page
      this.canvas.drawPage(inPage, {
        ...inPageDims,
        x: 0, y: 0
      });

      // draw other elements
      await writeCopyright(this, pageInfo);

      await writeSkills(this, pageInfo);

      await this.writePageOverlays(pageInfo);

      // apply the colour overlay
      log("Document", "Main colour:", this.settings.colour, this.settings.colourMode);
      if (this.settings.colour) {
        this.canvas.drawRectangle({
          x: 0, y: 0,
          width: inPageDims.width,
          height: inPageDims.height,
          color: this.settings.colour,
          blendMode: this.settings.colourMode
        });
      }

      // draw other elements
      await writeLogo(this, pageInfo);

      await writePortrait(this, pageInfo);

      await writeWatermark(this, pageInfo);
    } catch (e) {
      error("Document", "Cannot add page", pageInfo, e);
    }
  }

  async writePageOverlays(pageInfo) {
    if (this.settings.game == "pathfinder") {
      if (pageInfo.slot == "fighter") {
        for (let classPage of this.classPages) {
          if (classPage.slot == "fighter-maths") {
            await this.overlayPage(classPage);
            break;
          }
        }
      }
     
      // if (pageInfo.slot == "combat") {

      // }
    }

    if (this.settings.game == "starfinder") {
      if (pageInfo.slot == "core" && !isEmpty(this.primary.attributes.classes)) {
        log("Document", "Themes?");
        for (let cls of this.primary.attributes.classes) {
          let clsInfo = this.gameData.getClassInfo(cls);
          if (!isEmpty(clsInfo) && clsInfo.isTheme) {
            log("Document", "Theme", clsInfo);
            this.canvas.drawText(clsInfo.name, {
              x: 240,
              y: 642,
              font: this.altFont,
              size: 11,
              color: this.textColour,
            });
          }
        }
      }
    }
  }

  async overlayPage(pageInfo) {
    try {
      log("Document", "Overlay page", pageInfo);
      let pageFile = locatePage(pageInfo, this.settings);
      if (isEmpty(pageFile)) {
        error("Document", "Unknown page", pageInfo, pageFile);
        return;
      }

      const inDocBytes = readFileSync(pageFile);
      log("Document", "Overlay page:", inDocBytes.length, "bytes");
      
      let [inPage] = await this.document.embedPdf(inDocBytes);
      // log("Document", "Loaded page", inPage);
      let inPageDims = inPage.scale(1);
      log("Document", "Overlay page: dims", inPageDims);

      this.canvas.drawPage(inPage, {
        ...inPageDims,
        x: 0, y: 0
      });
      log("Document", "Overlay page: done");
    } catch (e) {
      error("Document", "Error overlaying", e);
    }
  }
  
  async finishDocument() {
    const pdfBytes = await this.document.save();
    return pdfBytes;
  }
}
