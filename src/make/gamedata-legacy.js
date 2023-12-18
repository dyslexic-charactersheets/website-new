// import { log } from "./util";
import { normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
import { access, readFile, constants as fsConstants } from 'fs';

import { has, log, error } from './util.js';

const __filename = fileURLToPath(import.meta.url);

export function loadGame(game) {
  return new Promise((resolve, reject) => {
    var filename = normalize(dirname(__filename)+'/../../../assets/data/'+game+'.json');
    access(filename, fsConstants.R_OK, err => {
      if (err) {
        error("gamedata", "File not found, or not readable:", filename, err);
        reject(err);
        return;
      }

      log("gamedata", "Loading file", filename);
      
      readFile(filename, 'utf-8', (err, data) => {
        if (err) {
          error("gamedata", "Error reading file:", filename, err);
          reject(err);
          return;
        }

        try {
          var json = JSON.parse(data);
          
          json.isDnd35 = game == "dnd35";
          json.isDnd = json.isDnd35;
          json.isPathfinder = game == "pathfinder";
          json.isStarfinder = game == "starfinder";

          switch (game) {
            case "pathfinder":
              json.defaultLogo = "pathfinder-pathfinder";
              break;
            case "starfinder":
              json.defaultLogo = "starfinder-starfinder";
              break;
            case "dnd35":
              json.defaultLogo = "dnd35-dnd35";
              break;
          }
          
          var books = {}
          json.books.forEach((book) => { books[book.name] = book; });
          
          var classes = {};
          json.classes.forEach((cls) => { classes[cls.name] = cls; });

          json.layout = json.layout.map((col) => {
            return col.map((bk) => {
              var book = books[bk];
              if (!has(book, "displayName")) {
                book.displayName = book.name;
              }

              book.classes = book.classes.map((cls) => {
                if (!has(classes, cls)) {
                  log("data", "Missing class: "+cls);
                  return null;
                } else {
                  var clas = classes[cls];
                  if (clas.name) {
                    clas.code = clas.name.toLowerCase().replace(/[^a-zA-Z]+/g, "-");
                  }
                  // if (clas.axes) {
                  //     clas.axisValues = axes.map((axis) => {
                  //         if ()
                  //     });
                  //     // def axisValues: List[List[String]] = axes.zipWithIndex.map { case (axisValues,index) =>
                  //     //     if (!axisValues.isEmpty) axisValues 
                  //     //     else variants.map(_.axes(index)).distinct
                  //     //   }
                  // }
                  return clas;
                }
              });
              return book;
            });
          });

          log("gamedata", "Loaded "+game);
          // console.log(json);
          resolve(json);

        } catch (e) {
          error("gamedata", "Error parsing game data:", filename, e);
          reject(err);
          return;
        }
      });
    });
  });
}
