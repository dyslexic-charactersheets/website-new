let logger = getDebug('build-classic');

function readClassicFormAndSubmit(type) {
  logger.log("Download");
  
  let request = readClassicForm(type);
  if (isLoggedIn()) {
    saveCharacter(request);
  }
  downloadCharacterSheet(request);
}

function readCheckbox(name) {
  for (let checkbox of document.getElementsByName(name)) {
    if (checkbox.checked) {
      return true;
    }
  }
  return false;
}

function readRadio(name) {
  let value = false;
  for (let radio of document.getElementsByName(name)) {
    if (radio.checked) {
      value = radio.value;
    }
  }
  return value;
}

function readInput(name) {
  for (let input of document.getElementsByName(name)) {
    return input.value;
  }
}

function readSelect(name) {
  let value = false;
  for (let select of document.getElementsByName(name)) {
    for (let option of select.options) {
      if (option.selected) {
        value = option.value;
      }
    }
  }
  return value;
}

function readClassicForm(type) {
  var form = document.getElementById("build-form");
  var game = form.dataset.game;
  var id = generateId();

  var character = {
    type,
    id,
    attributes: {
      game: game,
      isLoggedIn: isLoggedIn(),
      language: document.getElementById("body").dataset.language,
      classes: []
    }
  };

  // direct value map functions
  function mapCheckbox(name, attrib) {
    if (readCheckbox(name)) {
      character.attributes[attrib] = true;
      return true;
    }
    return false;
  }

  function mapRadio(name, attrib) {
    character.attributes[attrib] = readRadio(name);
    return character.attributes[attrib];
  }

  function mapInput(name, attrib) {
    character.attributes[attrib] = readInput(name);
    return character.attributes[attrib];
  }

  function mapSelect(name, attrib) {
    character.attributes[attrib] = readSelect(name);
    return character.attributes[attrib];
  }

  function mapAllSelects(name, attrib, limit = 10) {
    character.attributes[attrib] = [];
    for (let i = 0; i < limit; i++) {
      let skill = readSelect(name+"-"+i);
      let visible = false;
      for (let select of document.getElementsByName(name+"-"+i)) {
        let repeatableInstance = select.closest('.repeatable__instance');
        if (repeatableInstance.classList.contains('repeatable__instance--visible')) {
          visible = true;
        }
      }

      if (skill && visible) {
        character.attributes[attrib].push(skill);
      }
    }
    return character.attributes[attrib];
  }

  // attach images
  let attachments = [];
  function mapImage(name, value) {
    if (value === undefined || value === null || value == "") {
      return;
    }
    
    if (value.startsWith("data:")) {
      imageId = generateId();
      
      attachments.push({
        type: "image",
        id: imageId,
        data: value
      });

      character.attributes[name] = {
        type: "image",
        id: imageId
      };
    } else {
      character.attributes[name] = value;
    }
  }


  // game options
  switch(type) {
    // Character pages
    case 'character':
      // classes
      for (let classCheckbox of document.querySelectorAll('[data-class]')) {
        if (classCheckbox.checked) {
          var classname = classCheckbox.dataset['class'];
          var cls = { "class": classname };

          let variantSelects = document.querySelectorAll('[data-variant-for='+classname+']');
          if (variantSelects.length == 1) {
            cls.variant = [ variantSelects[0].value ];
          } else {
            cls.variant = [];
            for (let variantSelect of variantSelects) {
              let axis = variantSelect.dataset.variantAxis;
              cls.variant[axis] = variantSelect.value;
            }
          }

          character.attributes.classes.push(cls);
        }
      }

      mapCheckbox("permission", "permission");
      mapRadio("colour", "printColour");
      if (readCheckbox("has-watermark")) {
        mapInput("watermark", "watermark");
      }

      mapCheckbox("simple", "simple");
      mapCheckbox("more", "more");

      mapSelect("spellbook-size", "spellbookSize");
      mapSelect("inventory-style", "inventoryStyle");

      mapRadio("skills-list-style", "skillsListStyle");
      mapCheckbox("all-knowledge", "allKnowledge");
      if (readCheckbox("show-perform")) {
        mapAllSelects("perform-skill", "performSkills");
      }
      if (readCheckbox("show-craft")) {
        mapAllSelects("craft-skill", "craftSkills");
      }
      if (readCheckbox("show-profession")) {
        mapAllSelects("profession-skill", "professionSkills");
      }

      // additional pages
      mapCheckbox("build-my-character", "buildMyCharacter");
      if (mapCheckbox("include-background", "includeCharacterBackground") && game == "pathfinder") {
        character.attributes.characterBackgroundStyle = readCheckbox("include-pathfinder-society") ? "pathfinder-society" : "normal";
      }
      
      mapCheckbox("include-animal-companion", "includeAnimalCompanion");
      mapCheckbox("include-party-funds", "includePartyFunds");
      mapCheckbox("include-lycanthrope", "includeLycanthrope");
      mapCheckbox("include-intelligent-item", "includeIntelligentItem");
      mapCheckbox("include-mini", "includeMini");
      mapRadio("mini-size", "miniSize");

      switch(game) {
        case "pathfinder":
        case "dnd35":
          break;
      }

      mapImage("portrait", readInput("portrait"));
      mapImage("logo", readInput("logo"));
      break;
    
    // GM Downloads
    case 'gm':
      mapCheckbox("gm-permission", "permission");
      mapRadio("gm-colour", "printColour");

      let gmPick = mapInput("gm-pick", "gmPick");
      switch (gmPick) {
        case "characters":
          mapSelect("num-pcs", "numPCs");
          break;

        case "maps":
          mapRadio("maps-view", "mapsView");
          break;

        case "campaign":
          break;

        default:
          return;
      }

      break;

    case 'kingdom':
      mapCheckbox("kingdom-permission", "permission");
      mapRadio("settlement-style", "settlementStyle");
      mapRadio("kingdom-colour", "printColour");
      break;

    case 'starship':
      mapCheckbox("starship-permission", "permission");
      mapRadio("starship-colour", "printColour");
      break;

    case 'mini':
      mapCheckbox("mini-permission", "permission");
      mapRadio("mini-colour", "printColour");
      mapRadio("mini-mini-size", "miniSize");
      mapImage("portrait", readInput("mini-portrait"));
      break;
  }

  // appearance

  // make the full request object
  var request = {
    "version": 0,
    "data": character,
    "included": attachments
  };

  return request;
}
