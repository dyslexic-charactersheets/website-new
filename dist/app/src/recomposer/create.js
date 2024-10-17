import { log } from '#src/log.js';
import { Character } from './cls/Character.js';
import { GM } from './cls/GM.js';
import { Starship } from './cls/Starship.js';
import { Kingdom } from './cls/Kingdom.js';
import { Mini } from './cls/Mini.js';
import { All } from './cls/All.js';

export function createCharacterSheet(request) {
  return new Promise((resolve, reject) => {
    try {
      let primary = interpretPrimary(request.data, request.included);
      log("create", "Attachments", request.included.length);

      primary.create()
        .then((bytes) => {
          resolve({
            data: bytes,
            filename: primary.filename(),
          });
        })
        .catch((e) => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

function interpretPrimary(primary, attachments) {
  log("create", "Primary type:", primary.type);
  switch (primary.type) {
    case "all":
      return new All(primary, attachments);
    case "character":
      return new Character(primary, attachments);
    case "gm":
      return new GM(primary, attachments);
    case "starship":
      return new Starship(primary, attachments);
    case "kingdom":
      return new Kingdom(primary, attachments);
    case "mini":
      return new Mini(primary, attachments);
  }
}
