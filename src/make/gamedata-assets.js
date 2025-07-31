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

function loadAssetDir(subdir, innerdir, indexfile) {
  return new Promise((resolvePromise, reject) => {
    let assetsDir = resolve(`../../assets/${subdir}`);
    // let actualAssetsDir = (innerdir == "") ? assetsDir : `${assetsDir}/${innerdir}`;

    let iconicsFile = resolve(`${assetsDir}/${indexfile}`);
    log("gamedata", "Iconics file", iconicsFile);
  
    readFile(iconicsFile, 'utf-8', (err, data) => {
      if (err) {
        error("gamedata", "Error reading iconics", err);
        reject();
      }
  
      // console.log(data);
      let assets = data.split('\n').filter((line) => line != "").map((line) => {
        let [code, path] = line.split('=');
        code = code.trim();
        path = path.trim();
        return {code, path};
      });
  
      // Find all the folders
      let folders = new Set();
      let folderinfo = {};

      let groups = {};
      for (let asset of assets) {
        asset.folder = dirname(asset.code);
        asset.name = basename(asset.path).replace(/^[0-9]+ /, '');
        let folderpath = dirname(asset.path);
        let foldername = basename(folderpath).replace(/^[0-9]+ /, '');
        let depth = folderpath.split('/').length - 1;
        
        groups[asset.folder] = {
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
      log("gamedata", "Folders", folders);

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
        groups[asset.folder].values.push(asset);
      }
      log("gamedata", "Asset groups", groups);

      let jumpFolders = [];
      for (let folder of folders) {
        let group = folderinfo[folder];
        jumpFolders.push({
          code: folder,
          name: group.name,
          depth: group.depth,
        });
      }
      log("gamedata", "Jump folders", jumpFolders);

      let result = {
        values: assets,
        folders: jumpFolders,
        displayGroups: groups
      }
  
      resolvePromise(result);
    });
  });
}
