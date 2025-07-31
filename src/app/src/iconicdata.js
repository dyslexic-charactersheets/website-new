const fs = require('fs');
const path = require('path');

function createId(code) {
    code = code.toLowerCase();
    code = code.replace(/[^a-z0-9]+/g, '-');
    code = code.replace(/^-*/, '');
    code = code.replace(/-*$/, '');
    return code;
}

function loadAssets(data, base) {
    var assets = [];
    var lines = data.split(/\n/);
    for (let line of lines) {
        var parts = line.split(/=/);
        if (parts.length < 2) return;
        var code = parts[0].trim();
        var path = parts[1].trim();
        if (code == "" || path == "") return;
        
        var id = createId(code);
        var filename = code+".png";
        var url = base+filename;
        var name = path.replace(/^.*\//, '');
        var value;
        if (code.match(/^\/?iconics/)) {
            value = code.replace(/^\/?iconics\//, '').toLowerCase().replace(/[^a-z0-9/]+/g, '-')+".png";
        } else {
            value = code.replace(/^\/?logos\//, '')+".png";
        }
        assets.push({
            id: id,
            code: code,
            filename: filename,
            url: url,
            name: name,
            value: value,
            path: path
        });
    }
    return assets;
}

function groupAssets(assets) {
    var groups = {};

    for (let asset of assets) {
        var groupCode = asset.code.replace(/\/[^/]*$/, '');

        if (!has(groups, groupCode)) {
            var groupPath = asset.path.replace(/\/[^/]*$/, '');
            var groupName = groupPath.replace(/^.*\//, '').replace(/^[0-9]+ /, '');
            var folderName = groupPath.replace(/\/[^/]*$/, '').replace(/^[0-9]+ /, '');
            var groupId = createId(groupCode);

            groups[groupCode] = {
                id: groupId,
                code: groupCode,
                name: groupName,
                folder: folderName,
                path: groupPath,
                assets: [],
            };
        }

        groups[groupCode].assets.push(asset);
    }

    return groups;
}

// Iconics
var iconics = [];
var iconicGroups = {};

let assetsDir = path.normalize(`${__dirname}/../../../assets`);
fs.readFile(assetsDir+'/iconics/iconics.txt', 'utf-8', (err, data) => {
    if (err) {
        console.log("[data] Error loading iconics", err);
        return;
    }

    iconics = loadAssets(data, '/iconics/');
    iconicGroups = groupAssets(iconics);

    console.log("[data]          Loaded", iconics.length, "iconics in", Object.keys(iconicGroups).length, "groups");
});

// Logos
var logos = [];
var logoGroups = {};

fs.readFile(assetsDir+'/logos/logos.txt', 'utf-8', (err, data) => {
    if (err) {
        console.log("[data] Error loading logos", err);
        return;
    }

    logos = loadAssets(data, '/logos/');
    logoGroups = groupAssets(logos);

    console.log("[data]          Loaded", logos.length, "logos in", Object.keys(logoGroups).length, "groups");
});


module.exports = {
    iconics: () => iconics,
    iconicGroups: () => iconicGroups,
    logos: () => logos,
    logoGroups: () => logoGroups,
};
