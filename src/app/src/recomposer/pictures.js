import { readFileSync } from 'fs';

import { drawImage, PDFFont, decodeFromBase64DataUri } from 'pdf-lib';

// const { getGameData } = require('./cls/GameData.js');
import { log, warn, error } from '#src/log.js';
import { isEmpty, has } from './util.js';

import { getLogoPath, getLogoProfile } from './cls/LogoProfile.js';
import { getPortraitPath, getPortraitProfile } from './cls/PortraitProfile.js';

export async function writeLogo(doc, pageInfo) {
  let profile = getLogoProfile(pageInfo);

  if (profile != null) {
    let imageBytes = null;
    let format = "png";

    let logo = doc.settings.logo;
    let attachment = doc.getAttachment(logo);
    if (!isEmpty(attachment) && attachment.type == "image") {
      let logoData = attachment.data;
      if (logoData.match(/^data:image\/jpeg/)) {
        format = "jpeg";
      }
      imageBytes = decodeFromBase64DataUri(logoData);
    } else {
      const logoPath = getLogoPath(doc.settings);
      if (logoPath != null) {
        imageBytes = readFileSync(logoPath);
      }
    }

    if (imageBytes !== null) {
      let image;
      switch (format) {
        case "png":
          image = await doc.document.embedPng(imageBytes);
          break;
        case "jpeg":
          image = await doc.document.embedJpg(imageBytes);
          break;
      }
      
      let dims = profile.scale(image);
      doc.canvas.drawImage(image, dims);
    }
  }
}

export async function writePortrait(doc, pageInfo) {
  if (isEmpty(doc.settings.portrait)) {
    return;
  }

  log("pictures", "Get portrait profile", pageInfo.slot);
  let profiles = getPortraitProfile(pageInfo, doc.settings);
  for (let profile of profiles) {
    let imageBytes = null;
    let format = "png";
    
    // log("pictures", "Portrait", doc.settings.portrait);

    let portrait = doc.settings.portrait;
    let attachment = doc.getAttachment(portrait);
    // log("pictures", "Attachment", attachment);
    if (!isEmpty(attachment) && attachment.type == "image") {
      let portraitData = attachment.data;
      if (portraitData.match(/^data:image\/jpeg/)) {
        format = "jpeg";
      }
      imageBytes = decodeFromBase64DataUri(portraitData);
    } else {
      const portraitPath = getPortraitPath(portrait);
      if (portraitPath !== null) {
        imageBytes = readFileSync(portraitPath);
      }
    }

    if (imageBytes !== null) {
      let image;
      switch (format) {
        case "png":
          image = await doc.document.embedPng(imageBytes);
          break;
        case "jpeg":
          image = await doc.document.embedJpg(imageBytes);
          break;
      }
      let dims = profile.scale(image);
      doc.canvas.drawImage(image, dims);
    }

  }
}
