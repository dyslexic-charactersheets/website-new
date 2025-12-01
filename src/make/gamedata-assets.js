/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

import { access, existsSync, readFile, constants as fsConstants, readFileSync } from 'fs';
import { resolve, normalize, dirname, basename } from 'path';

import { has, log, error } from './util.js';


export function loadAssets() {
  return Promise.all([
    loadAssetDir('iconics', 'large', 'iconics.txt'),
    loadAssetDir('logos', '', 'logos.txt'),
  ]).then(([iconics, logos]) => {
    return {iconics, logos}
  });
}

function findImagePath(assetsDir, innerdir, path) {
  let baseDir = (innerdir == "") ? assetsDir : `${assetsDir}/${innerdir}`;
  
  let pngPath = `${baseDir}/${path}.png`;
  if (existsSync(pngPath)) {
    return `${path}.png`;
  }
  
  let jpgPath = `${baseDir}/${path}.jpg`;
  if (existsSync(jpgPath)) {
    return `${path}.jpg`;
  }

  error("gamedata", "Cannot find file:", path);
  return null;
}

function loadAssetDir(subdir, innerdir, indexfile) {
  return new Promise((resolvePromise, reject) => {
    let assetsDir = resolve(`../../assets/${subdir}`);
    // let actualAssetsDir = (innerdir == "") ? assetsDir : `${assetsDir}/${innerdir}`;

    let indexFile = resolve(`${assetsDir}/${indexfile}`);
    log("gamedata", "Asset index file", indexFile);
  
    readFile(indexFile, 'utf-8', (err, data) => {
      if (err) {
        error("gamedata", "Error reading assets index", err);
        reject();
      }
  
      // console.log(data);
      let assets = data.split('\n').filter((line) => line != "").map((line) => {
        let [code, path] = line.split('=');
        let shortpath = code.trim();
        code = code.trim().toLowerCase().replaceAll(' ', '-').replaceAll('/', '-');
        path = path.trim();
        let imgpath = findImagePath(assetsDir, innerdir, shortpath);
        return {code, path, shortpath, imgpath};
      });
  
      // Find all the folders
      let folders = new Set();
      let folderinfo = {};

      let groups = {};
      for (let asset of assets) {
        asset.folder = dirname(asset.shortpath);
        asset.name = basename(asset.path).replace(/^[0-9]+ /, '');
        let folderpath = dirname(asset.path);
        let foldername = basename(folderpath).replace(/^[0-9]+ /, '');
        let depth = folderpath.split('/').length - 1;
        
        groups[asset.folder] = {
          code: asset.folder.trim().toLowerCase().replaceAll(' ', '-').replaceAll('/', '-'),
          group: asset.folder,
          path: folderpath,
          name: foldername,
          depth,
          values: []
        };
        function addFolder(folder, folderpath) {
          try {
            if (folders.has(folder)) {
              return;
            }

            // parent first, so the hierarchy flows right in the folders sidebar
            let parent = dirname(folder);
            let parentpath = dirname(folderpath);
            if (parent !== undefined && parent !== null && parent != "" && parent != ".") {
              addFolder(parent, parentpath);
            }

            // add this folder to the list
            folders.add(folder);
            
            // and store info about it
            // let folderpath = dirname(path);
            let foldername = basename(folderpath).replace(/^[0-9]+ /, '');
            let depth = folderpath.split('/').length;
            folderinfo[folder] = {
              code: folder.trim().toLowerCase().replaceAll(' ', '-').replaceAll('/', '-'),
              group: folder,
              path: folderpath,
              name: foldername,
              depth,
              values: []
            };
          } catch (err) {
            error("gamedata", "Error", err);
          }
        }
        addFolder(asset.folder, folderpath);
      }
      // log("gamedata", "Folders", folders);

      // Load copyright files
      // let copyright = {};
      // for (let folder of folders) {
      //   let copyrightFile = `${actualAssetsDir}/${folder}/copyright.txt`;
      //   if (existsSync(copyrightFile)) {
      //     let copyrightFileData = readFileSync(copyrightFile, 'utf-8');
      //     let copyrightLines = copyrightFileData.split('\n').filter((l) => l != "");
      //     let copyrightDict = {};
      //     for (let line of copyrightLines) {
      //       let [key, value] = line.split('=');
      //       key = key.trim();
      //       value = value.trim();
      //       copyrightDict[key] = value;
      //     }
      //     copyright[folder] = copyrightDict;
      //   }
      // }

      // Cascade copyright values
      // for (let folder of folders) {
      //   if (has(copyright, folder)) {
      //     copyrightDict = copyright[folder];
      //   }
      // }
      // log("gamedata", "Copyright", copyright);

      // Merge in copyright values into asset items
      // assets = assets.map((asset) => {
      //   if (has(copyright, asset.code)) {
      //     return {
      //       ...copyright[folder],
      //       ...asset
      //     }
      //   }
      //   return asset;
      // });

      for (let asset of assets) {
        // fill in other values
        asset = enrishAsset(asset);
        groups[asset.folder].values.push(asset);
      }
      // log("gamedata", "Asset groups", groups);

      let jumpFolders = [];
      for (let folder of folders) {
        let group = folderinfo[folder];
        jumpFolders.push({
          code: group.code,
          name: group.name,
          depth: group.depth,
        });
      }
      // log("gamedata", "Jump folders", jumpFolders);

      let result = {
        values: assets,
        folders: jumpFolders,
        displayGroups: groups
      }
  
      resolvePromise(result);
    });
  });

  // add specific metadata to the assets
  // though awkward, this is easier than adding metadata at source
  function enrishAsset(asset) {
    asset.size = '';

    // small tokens
    let code = asset.code;
    if (
      // iconics
      (code.match('bard-lem') 
          && !code.match('haunting-choir')
        )
      || code.match('playtest-lem')
      || code.match('druid-lini')
      || code.match('alchemist-fumbus')
      || code.match('summoner-balazar')
      || code.match('mesmerist-meligaster')

      // ancestry
      || (code.match('gnome')
          && !code.match('gnome-fireworks')
          && !code.match('gnome-gunner')
        )
      || (code.match('goblin')
          && !code.match('hobgoblin')
        )
      || (code.match('halfling')
          && !code.match('halfling-jamus')
          && !code.match('halfling-barfight')
        )
      || code.match('skittermander')
      || (code.match('ysoki')
          && !code.match('monster-creation')
          && !code.match('sfblog')
        )
      || code.match('grippli')

      // individual pictures
      || code.match('pathfinder-forester')
      || code.match('pathfinder-summoner')
      || code.match('pathfinder-caleb')
      || code.match('wallpaper-class-cleric')
    ) {
      asset.size = 'small-figure';
    }

    // medium tokens
    else if (
      // iconics
      (code.match('ranger-harsk')
          && code.match('harsk-mushroom')
        )

      // ancestry
      || code.match('dwarf')
      || code.match('dwarves')
      || code.match('kobold')
    ) {
      asset.size = 'medium-figure';
    }

    return asset;
  }
}
