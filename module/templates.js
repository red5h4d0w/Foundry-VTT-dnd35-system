/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/dnd35e/templates/actors/parts/actor-traits.html",
    "systems/dnd35e/templates/actors/parts/actor-inventory.html",
    "systems/dnd35e/templates/actors/parts/actor-features.html",
    "systems/dnd35e/templates/actors/parts/actor-spellbook.html",

    // Item Sheet Partials
    "systems/dnd35e/templates/items/parts/item-action.html",
    "systems/dnd35e/templates/items/parts/item-activation.html",
    "systems/dnd35e/templates/items/parts/item-description.html",
    "systems/dnd35e/templates/items/spell/spell-activation.html",
    "systems/dnd35e/templates/items/backpack/backpack-content.html",
    "systems/dnd35e/templates/items/class/class-spellbook.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};

/*
    {
      "name": "classes",
      "label": "Classes (SRD)",
      "system": "dnd35e",
      "path": "./packs/classes.db",
      "entity": "Item"
    },
    {
      "name": "classfeatures",
      "label": "Class Features (SRD)",
      "system": "dnd35e",
      "path": "./packs/classfeatures.db",
      "entity": "Item"
    },
    {
      "name": "feats",
      "label": "Feats (SRD)",
      "system": "dnd35e",
      "path": "./packs/feats.db",
      "entity": "Item"
    },
    {
      "name": "items",
      "label": "Items (SRD)",
      "system": "dnd35e",
      "path": "./packs/items.db",
      "entity": "Item"
    },
    {
      "name": "monsters",
      "label": "Monsters (SRD)",
      "system": "dnd35e",
      "path": "./packs/monsters.db",
      "entity": "Actor"
    },
    {
      "name": "prestigeclasses",
      "label": "Prestige Classes (SRD)",
      "system": "dnd35e",
      "path": "./packs/prestigeclasses.db",
      "entity": "Item"
    },
    {
      "name": "races",
      "label": "Races (SRD)",
      "system": "dnd35e",
      "path": "./packs/races.db",
      "entity": "Item"
    },
    {
      "name": "spells",
      "label": "Spells (SRD)",
      "system": "dnd35e",
      "path": "./packs/spells.db",
      "entity": "Item"
    }
*/
