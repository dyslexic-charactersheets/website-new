import { createCharacterSheet } from '#src/recomposer/create.js';

import { log, error } from '#src/log.js';
import { isArray } from './util.js';

function buildPdf(req, res, game) {
  try {
    let body = JSON.parse(req.body);
    // log("recomposer", "Request:", body.data, "and", isArray(body.included) ? body.included.length : "no", "attachments");
    if (body.data.attributes.game != game) {
      error("recomposer", `Game ${body.data.game} != ${game}`);
      res.status(400);
      res.send("Bad Request");
      return;
    }

    createCharacterSheet(body)
      .then((result) => {
        if (result.err) {
          error("recomposer", "Error:", result.err);
          res.status(500);
          res.send("Error");
          return;
        }
    
        // log("recomposer", "Data length", result.data.length);
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Length', result.data.length);
        res.set('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(Buffer.from(result.data));
        // log("recomposer", "Response headers", res._header);
        log("recomposer", "Sent");
      })
      .catch((x) => {
        log("recomposer", "Error:", x);
        res.status(500);
        res.send("Error");
      });
  } catch (x) {
    error("recomposer", "Error", x);
    res.send(500);
    res.send("Error");
  }
}

export function renderPathfinder1 (req, res) {
  log("recomposer", "Pathfinder 1");
  buildPdf(req, res, "pathfinder");
}

export function renderStarfinder1 (req, res) {
  log("recomposer", "Starfinder 1");
  buildPdf(req, res, "starfinder");
}

export function renderDnD35 (req, res) {
  log("recomposer", "D&D 3.5");
  buildPdf(req, res, "dnd35");
}
