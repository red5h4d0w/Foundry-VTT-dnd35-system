import { Dice35e } from "../dice.js";
import { ShortRestDialog } from "../apps/short-rest.js";
import { SpellCastDialog } from "../apps/spell-cast-dialog.js";
import { AbilityTemplate } from "../pixi/ability-template.js";


/**
 * Extend the base Actor class to implement additional logic specialized for D&D3.5e.
 */
export class Actor35e extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Actor's data object
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;
    const config = CONFIG.DND35E;

    // Prepare Character data
    if ( actorData.type === "character" ) this._prepareCharacterData(actorData);
    else if ( actorData.type === "npc" ) this._prepareNPCData(actorData);

    // Ranged Weapon/Melee Weapon/Ranged Spell/Melee Spell attack bonuses are added when rolled since they are not a fixed value.
    // Damage bonus added when rolled since not a fixed value.
    // Spell DC depends on class and spell level so it is not there

    // Ability modifiers
    for (let abl of Object.values(data.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      // There are temp modifier to add
    }

    // Armor Class
    let ac = data.attributes.ac
    ac.armorBonus = this.getArmorBonus();
    ac.shieldBonus = this.getShieldBonus();
    ac.dexMod = this.getArmorDexterityModifier();
    ac.natural = parseInt(ac.natural || 0);
    ac.size = this.getArmorSizeModifier();
    ac.misc = parseInt(ac.misc || 0);
    // There is a Deflection bonus not implemented yet
    // Dodge AC is not implemented yet and normally is specifid to targets
    ac.value = 10 + ac.armorBonus + ac.shieldBonus + ac.dexMod + ac.natural + ac.size + ac.misc;
    ac.touch = ac.value - ac.armorBonus - ac.shieldBonus - ac.natural
    ac.flatFooted = ac.value - ac.dexMod

    // Base Attack Bonus
    data.attributes.bab.value = this.getBaseAttackBonus();

    // Saving throw bonus
    for (const save in data.saves) {
      // Gets the base save bonus of the actor for the save
      const baseSaveBonus = this.getBaseSaveBonus(save);
      data.saves[save].magic = parseInt(data.saves[save].magic || 0);
      data.saves[save].misc = parseInt(data.saves[save].misc || 0);
      data.saves[save].temp = parseInt(data.saves[save].temp || 0);
      // Add the ability modifier associated with the saving throw
      data.saves[save].mod = baseSaveBonus + data.abilities[data.saves[save].ability].mod + data.saves[save].magic + data.saves[save].misc + data.saves[save].temp;
    };

    // Skill modifiers
    for (const skill in data.skills) {
      // Sets the proficiencies for the skill
      data.skills[skill].proficiency = this.getSkillProficiency(skill);
      data.skills[skill].rank = parseFloat(data.skills[skill].rank || 0);
      data.skills[skill].bonus = parseInt(data.skills[skill].bonus || 0);
      data.skills[skill].mod = Math.floor(data.abilities[data.skills[skill].ability].mod + skl.bonus);
    }

    // Spell Resistance
    data.attributes.spellResistance = parseInt(data.attributes.spellResistance);

    // Initiative
    let init = data.attributes.init;
    init.mod = data.abilities.dex.mod;
    init.bonus = parseInt(init.bonus) || 0;
    init.total = init.mod + init.prof + init.bonus;

    // Grapple Modifier
    let grapple = data.attributes.grapple;
    grapple.bab = data.attributes.bab.value;
    grapple.strMod = data.abilities.str.value;
    grapple.sizeMod = this.getGrappleSizeModifier();
    grapple.misc = parseInt(grapple.misc);
    grapple.value = grapple.bab + grapple.strMod + grapple.sizeMod + grapple.misc;
  }

  /* -------------------------------------------- */

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Determine character level and available hit dice based on owned Class items
    const [level, hd] = actorData.items.reduce((arr, item) => {
      if ( item.type === "class" ) {
        const classLevels = parseInt(item.data.levels) || 1;
        arr[0] += classLevels;
        arr[1] += classLevels - (parseInt(item.data.hitDiceUsed) || 0);
      }
      return arr;
    }, [0, 0]);
    data.details.level = level;
    data.attributes.hd = hd;

    // Character proficiency bonus
    data.attributes.prof = Math.floor((level + 7) / 4);

    // Experience required for next level
    const xp = data.details.xp;
    xp.max = this.getLevelExp(level || 1);
    const prior = this.getLevelExp(level - 1 || 0);
    const required = xp.max - prior;
    const pct = Math.round((xp.value - prior) * 100 / required);
    xp.pct = Math.clamped(pct, 0, 100);
  }

  /* -------------------------------------------- */

  /**
   * Prepare NPC type specific data
   */
  _prepareNPCData(actorData) {
    const data = actorData.data;

    // Kill Experience
    data.details.xp.value = this.getCRExpScale(data.details.cr);

    // Proficiency
    data.attributes.prof = Math.floor((Math.max(data.details.cr, 1) + 7) / 4);

    // Spellcaster Level
    if ( data.attributes.spellcasting && !data.details.spellLevel ) {
      data.details.spellLevel = Math.max(data.details.cr, 1);
    }
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Getters
  /* -------------------------------------------- */

  getArmorBonus(){
    let armorBonus = 0;
    // Checks if Embedded Entities have been loaded
    if (this.items) {
      // Find Armors
      let armors = this.items.filter(item => item.type = "armor");
      // Removes Shields
      armors = armors.filter(armor => armor.data.data.type !== "shield");
      // Find Equipped Armors
      const equippedArmors = armors.filter(armor => armor.data.data.equipped);
      // Find and Add their respective Armor Bonus
      for (armor of equippedArmors) {
        armorBonus += parseInt(armor.data.data.value);
      };
    };
    return armorBonus;
  };


  getArmorDexterityModifier(dexMod){
    let maxDexModifier;
    // Checks if Embedded Entities have been Loaded
    if (this.items) {
      // Find Equipped Armors and Find their Max Dex modifier
      const armors = this.items.filter(item => item.type = "armor");
      const equippedArmors = armors.filter(armor => armor.data.data.equipped);
      for (armor of equippedArmors) {
        // Checks if Armor Imposes a Maximal Dexterity Modifier
        if (armor.data.data.maxDex) {
          // Checks Whether the Maximal Dexterity Modifier is Inferior to the Current Maximal Dexterity Modifier if it Exists
          if ( (parseInt(armor.data.data.maxDex) < maxDexModifier) || !maxDexModifier){
            maxDexModifier = armor.data.data.maxDex;
          };
        };
      };
    };
    // Gets the Dexterity Modifier or it's maximal value
    const armorDexMod = maxDexModifier? Math.min(maxDexModifier, dexMod): dexMod;
    return armorDexMod;
  };

  getArmorSizeModifier(){
    const config = CONFIG.DND35E;
    return config.AC_SIZE_MODIFIER[this.data.data.attributes.size];
  };


  /**
   * Returns the base attack bonus for this actor
   * @return {number}           The base attack bonus
   */
  getBaseAttackBonus(){
    let baseAttackBonus = 0;
    const data = this.data.data;
    // Checks if there is a custom base attack bonus defined (NPCs do not have base attack bonus derived from owned classes)
    if (data.attributes.bab.custom) {
      return data.attributes.bab.custom;
    };
    // Checks if embedded entities have been loaded
    if (this.items) {
      // Checks all classes owned by the actor to find their Base Attack Bonuses and add them
      const config = CONFIG.DND35E;
      const classes = this.items.filter(item => item.type = "class");
      // Could probably be rewritten with a reduce() method instead
      for (const c of classes) {
        const classLevel = c.data.data.levels;
        if (c.data.data.bab.progression) {
          const table = config.BAB_TABLES[c.data.data.bab.progression]
          baseAttackBonus += table[classLevel];
        };
      };
    };

    return baseAttackBonus;
  };


  /* -------------------------------------------- */
  
  /**
   * Returns the base save bonus for this actor using a certain saving throw
   * @param {string} save       The saving throw used
   * @return {number}           The base save bonus for the saving throw
   */
  getBaseSaveBonus(save){
    let baseSaveBonus = 0
    const config = CONFIG.DND35E;
    if (this.data.data.attributes.saves[save].custom) {
      return this.data.data.attributes.saves[save].custom;
    };
    if (this.items) {
      const classes = this.items.filter(item => item.type = "class");
      for (const c of classes) {
        const classLevel = c.data.data.levels;
        if (c.data.data.savesProgression){
          const table = config.SAVE_TABLE[c.data.data.savesProgression[save]];
          baseSaveBonus += table[classLevel];
        };
      };
    };
    return baseSaveBonus;
  };

  /* -------------------------------------------- */

  /**
   * Return the amount of experience required to gain a certain character level.
   * @param level {Number}  The desired level
   * @return {Number}       The XP required
   */
  getLevelExp(level) {
    const levels = CONFIG.DND35E.CHARACTER_EXP_LEVELS;
    return levels[Math.min(level, levels.length - 1)];
  }

  /* -------------------------------------------- */

  /**
   * Return the experience scale granted by killing a creature of a certain CR.
   * @param cr {Number}     The creature's challenge rating
   * @return {Array}       The experience scale granted per kill
   */
  getCRExpScale(cr) {
    if (cr < 1.0) return Math.floor(CONFIG.DND35E.CR_EXP_LEVELS[0].map(function(x) { return x * cr; }));
    if (cr < 20.0 && (cr%2==1)) return CONFIG.DND35E.CR_EXP_LEVELS[18].map(function(x) {return x * 2**((cr-19)/2)});
    if (cr < 20.0 && (cr%2==0)) return CONFIG.DND35E.CR_EXP_LEVELS[19].map(function(x) {return x * 2**((cr-20)/2)});
    return CONFIG.DND35E.CR_EXP_LEVELS[Math.floor(cr)-1];
  }

  /* -------------------------------------------- */

  getGrappleSizeModifier(){
    const config = CONFIG.DND35E;
    return config.GRAPPLE_SIZE_MODIFIER[this.data.data.attributes.size];
  };


  getShieldBonus() {
    let shieldBonus = 0;
    if (this.items) {
      let armors = this.items.filter(item => item.type = "armor");
      // Removes Items that are not shields
      armors = armors.filter(armor => armor.data.data.type === "shield");
      // Find Equipped Shields
      const equippedShields = armors.filter(armor => armor.data.data.equipped);
      // Find and Add their Respective Shield Bonus
      for (shield of equippedShields) {
        shieldBonus += parseInt(shield.data.data.value);
      };
    };
    return shieldBonus;
  }

  /* -------------------------------------------- */
  
  /**
  * Return the spell DC for this actor using a certain ability score
  * @param {string} skill    The skill identifier, i.e. "jum"
  * @return {number}         The proficiency of that skill
  */

  getSkillProficiency(skill) {
    let proficiency = 0;
    // Checks if skill can be used untrained and if so gives half-proficiency
    CONFIG.DND35E.UNTRAINED_SKILLS.includes(skill)? proficiency = 0.5 : 0;
    // Checks if Embedded Entities have been loaded
    if (this.items) {
      // Checks whether classes owned by the actor have said proficiency
      const classes = this.items.filter(item => item.type === "class");
      for (c of classes){
        if (c.data.data.skillProficiency[skill]){
          proficiency = 1
        };
      };
    };
    return proficiency;
  };


  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
  /* -------------------------------------------- */

  /** @override */
  static async create(data, options={}) {
    data.token = data.token || {};
    if ( data.type === "character" ) {
      mergeObject(data.token, {
        vision: true,
        dimSight: 30,
        brightSight: 0,
        actorLink: true,
        disposition: 1
      }, {overwrite: false});
    }
    return super.create(data, options);
  }

  /* -------------------------------------------- */

  /** @override */
  async update(data, options={}) {

    // Apply changes in Actor size to Token width/height
    const newSize = data["data.traits.size"];
    if ( newSize !== getProperty(this.data, "data.traits.size") ) {
      let size = CONFIG.DND35E.tokenSizes[newSize];
      if ( this.isToken ) this.token.update({height: size, width: size});
      else if ( !data["token.width"] && !hasProperty(data, "token.width") ) {
        data["token.height"] = size;
        data["token.width"] = size;
      }
    }
    return super.update(data, options);
  }

  /* -------------------------------------------- */

  /** @override */
  async createOwnedItem(itemData, options) {

    // Assume NPCs are always proficient with weapons and always have spells prepared
    if ( !this.isPC ) {
      let t = itemData.type;
      let initial = {};
      if ( t === "weapon" ) initial["data.proficient"] = true;
      if ( ["weapon", "equipment"].includes(t) ) initial["data.equipped"] = true;
      if ( t === "spell" ) initial["data.prepared"] = true;
      mergeObject(itemData, initial);
    }
    return super.createOwnedItem(itemData, options);
  }

  /* -------------------------------------------- */

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta, isBar) {
    if ( attribute !== "attributes.hp" ) return super.modifyTokenAttribute(attribute, value, isDelta, isBar);

    // Get current and delta HP
    const hp = getProperty(this.data.data, attribute);
    const tmp = parseInt(hp.temp) || 0;
    const current = hp.value + tmp;
    const max = hp.max + (parseInt(hp.tempmax) || 0);
    const delta = isDelta ? value : value - current;

    // For negative changes, deduct from temp HP
    let dtmp = delta < 0 ? Math.max(-1*tmp, delta) : 0;
    let dhp = delta - dtmp;
    return this.update({
      "data.attributes.hp.temp": tmp + dtmp,
      "data.attributes.hp.value": Math.clamped(hp.value + dhp, 0, max)
    });
  }

  /* -------------------------------------------- */
  /*  Rolls                                       */
  /* -------------------------------------------- */

  /**
   * Cast a Spell, consuming a spell slot of a certain level
   * @param {Item35e} item   The spell being cast by the actor
   * @param {Event} event   The originating user interaction which triggered the cast 
   */
  async useSpell(item, {configureDialog=true}={}) {
    if ( item.data.type !== "spell" ) throw new Error("Wrong Item type");

    // Determine if the spell uses slots
    let lvl = item.data.data.level;
    const usesSlots = (lvl > 0) && item.data.data.preparation.mode === "prepared";
    if ( !usesSlots ) return item.roll();

    // Configure the casting level and whether to consume a spell slot
    let consume = true;
    let placeTemplate = false;
        
    if ( configureDialog ) {
      const spellFormData = await SpellCastDialog.create(this, item);
      lvl = parseInt(spellFormData.get("level"));
      consume = Boolean(spellFormData.get("consume"));
      placeTemplate = Boolean(spellFormData.get("placeTemplate"));
      if ( lvl !== item.data.data.level ) {
        item = item.constructor.createOwned(mergeObject(item.data, {"data.level": lvl}, {inplace: false}), this);
      } 
    }

    // Update Actor data
    if ( consume && (lvl > 0) ) {
      await this.update({
        [`data.spells.spell${lvl}.value`]: Math.max(parseInt(this.data.data.spells["spell"+lvl].value) - 1, 0)
      });
    }

    // Initiate ability template placement workflow if selected
    if (item.hasAreaTarget && placeTemplate) {
      const template = AbilityTemplate.fromItem(item);
      if ( template ) template.drawPreview(event);
      if ( this.sheet.rendered ) this.sheet.minimize();
    }

    // Invoke the Item roll
    return item.roll();
  }

  /* -------------------------------------------- */

  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} skillId      The skill id (e.g. "ins")
   * @param {Object} options      Options which configure how the skill check is rolled
   * @return {Promise.<Roll>}   A Promise which resolves to the created Roll instance
   */
  rollSkill(skillId, options={}) {
    const skl = this.data.data.skills[skillId];
    const parts = ["@mod"];
    const data = {mod: skl.mod};

    // Include a global actor skill bonus
    const actorBonus = getProperty(this.data.data.bonuses, "abilities.skill");
    if ( !!actorBonus ) {
      parts.push("@skillBonus");
      data.skillBonus = actorBonus;
    }

    // Roll and return
    return Dice35e.d20Roll({
      event: options.event,
      parts: parts,
      data: data,
      title: `${CONFIG.DND35E.skills[skillId]} Skill Check`,
      speaker: ChatMessage.getSpeaker({actor: this})
    });
  }

  /* -------------------------------------------- */

  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param {String}abilityId     The ability id (e.g. "str")
   * @param {Object} options      Options which configure how ability tests or saving throws are rolled
   */
  rollAbility(abilityId, options={}) {
    const label = CONFIG.DND35E.abilities[abilityId];
    new Dialog({
      title: `${label} Ability Check`,
      content: `<p>What type of ${label} check?</p>`,
      buttons: {
        test: {
          label: "Ability Test",
          callback: () => this.rollAbilityTest(abilityId, options)
        },
        save: {
          label: "Saving Throw",
          callback: () => this.rollAbilitySave(abilityId, options)
        }
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {String} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise.<Roll>}   A Promise which resolves to the created Roll instance
   */
  rollAbilityTest(abilityId, options={}) {
    const label = CONFIG.DND35E.abilities[abilityId];
    const abl = this.data.data.abilities[abilityId];
    const parts = ["@mod"];
    const data = {mod: abl.mod};

    // Include a global actor ability check bonus
    const actorBonus = getProperty(this.data.data.bonuses, "abilities.check");
    if ( !!actorBonus ) {
      parts.push("@checkBonus");
      data.checkBonus = actorBonus;
    }

    // Roll and return
    return Dice35e.d20Roll({
      event: options.event,
      parts: parts,
      data: data,
      title: `${label} Ability Test`,
      speaker: ChatMessage.getSpeaker({actor: this})
    });
  }

  /* -------------------------------------------- */

  /**
   * Roll a Saving Throw
   * Prompt the user for input regarding any Situational Bonus
   * @param {String} saveId    The save ID (e.g. "wil")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise.<Roll>}   A Promise which resolves to the created Roll instance
   */
  rollSavingThrow(saveId, options={}) {
    const label = CONFIG.DND35E.saves[saveId];
    const abl = this.data.data.saves[saveId];
    const parts = ["@mod"];
    const data = {mod: abl.save};

    // Include a global actor ability save bonus
    const actorBonus = getProperty(this.data.data.bonuses, "abilities.save");
    if ( actorBonus ) {
      parts.push("@saveBonus");
      data.saveBonus = actorBonus;
    }

    // Roll and return
    return Dice35e.d20Roll({
      event: options.event,
      parts: parts,
      data: data,
      title: `${label} Saving Throw`,
      speaker: ChatMessage.getSpeaker({actor: this}),
    });
  }

  /* -------------------------------------------- */

  /**
   * Perform a death saving throw, rolling a d20 plus any global save bonuses
   * @param {Object} options        Additional options which modify the roll
   * @return {Promise<Roll|null>}   A Promise which resolves to the Roll instance
   */
  async rollDeathSave(options={}) {

    // Execute the d20 roll dialog
    const bonus = getProperty(this.data.data.bonuses, "abilities.save");
    const parts = !!bonus ? ["@saveBonus"] : [];
    const speaker = ChatMessage.getSpeaker({actor: this});
    const roll = await Dice35e.d20Roll({
      event: options.event,
      parts: parts,
      data: {saveBonus: parseInt(bonus)},
      title: `Death Saving Throw`,
      speaker: speaker,
      halflingLucky: this.getFlag("dnd35e", "halflingLucky")
    });
    if ( !roll ) return null;

    // Take action depending on the result
    const success = roll.total >= 10;
    const death = this.data.data.attributes.death;
    
    // Save success
    if ( success ) {
      let successes = (death.success || 0) + (roll.total === 20 ? 2 : 1);
      if ( successes === 3 ) {      // Survival
        await this.update({
          "data.attributes.death.success": 0,
          "data.attributes.death.failure": 0,
          "data.attributes.hp.value": 1
        });
        await ChatMessage.create({content: `${this.name} has survived with 3 death save successes!`, speaker});
      }
      else await this.update({"data.attributes.death.success": Math.clamped(successes, 0, 3)});
    } 
    
    // Save failure
    else {
      let failures = (death.failure || 0) + (roll.total === 1 ? 2 : 1);
      await this.update({"data.attributes.death.failure": Math.clamped(failures, 0, 3)});
      if ( failures === 3 ) {       // Death
        await ChatMessage.create({content: `${this.name} has died with 3 death save failures!`, speaker});
      }
    }

    // Return the rolled result
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll a hit die of the appropriate type, gaining hit points equal to the die roll plus your CON modifier
   * @param {string} formula    The hit die type to roll. Example "d8"
   */
  async rollHitDie(formula) {

    // Find a class (if any) which has an available hit die of the requested denomination
    const cls = this.items.find(i => {
      const d = i.data.data;
      return (d.hitDice === formula) && ((d.levels || 1) - (d.hitDiceUsed || 0) > 0);
    });

    // If no class is available, display an error notification
    if ( !cls ) {
      return ui.notifications.error(`${this.name} has no available ${formula} Hit Dice remaining!`);
    }

    // Prepare roll data
    const parts = [formula, "@abilities.con.mod"];
    const title = `Roll Hit Die`;
    const rollData = duplicate(this.data.data);

    // Call the roll helper utility
    const roll = await Dice35e.damageRoll({
      event: new Event("hitDie"),
      parts: parts,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({actor: this}),
      critical: false,
      dialogOptions: {width: 350}
    });
    if ( !roll ) return;

    // Adjust actor data
    await cls.update({"data.hitDiceUsed": cls.data.data.hitDiceUsed + 1});
    const hp = this.data.data.attributes.hp;
    const dhp = Math.min(hp.max - hp.value, roll.total);
    return this.update({"data.attributes.hp.value": hp.value + dhp});
  }

  /* -------------------------------------------- */

  /**
   * Cause this Actor to take a Short Rest
   * During a Short Rest resources and limited item uses may be recovered
   * @param {boolean} dialog  Present a dialog window which allows for rolling hit dice as part of the Short Rest
   * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
   * @return {Promise}        A Promise which resolves once the short rest workflow has completed
   */
  async shortRest({dialog=true, chat=true}={}) {
    const data = this.data.data;

    // Take note of the initial hit points and number of hit dice the Actor has
    const hd0 = data.attributes.hd;
    const hp0 = data.attributes.hp.value;

    // Display a Dialog for rolling hit dice
    if ( dialog ) {
      const rested = await ShortRestDialog.shortRestDialog({actor: this, canRoll: hd0 > 0});
      if ( !rested ) return;
    }

    // Note the change in HP and HD which occurred
    const dhd = data.attributes.hd - hd0;
    const dhp = data.attributes.hp.value - hp0;

    // Recover character resources
    const updateData = {};
    for ( let [k, r] of Object.entries(data.resources) ) {
      if ( r.max && r.sr ) {
        updateData[`data.resources.${k}.value`] = r.max;
      }
    }
    await this.update(updateData);

    // Recover item uses
    const items = this.items.filter(item => item.data.data.uses && (item.data.data.uses.per === "sr"));
    const updateItems = items.map(item => {
      return {
        _id: item._id,
        "data.uses.value": item.data.data.uses.max
      };
    });
    await this.updateManyEmbeddedEntities("OwnedItem", updateItems);

    // Display a Chat Message summarizing the rest effects
    if ( chat ) {
      let msg = `${this.name} takes a short rest spending ${-dhd} Hit Dice to recover ${dhp} Hit Points.`;
      ChatMessage.create({
        user: game.user._id,
        speaker: {actor: this, alias: this.name},
        content: msg,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      });
    }

    // Return data summarizing the rest effects
    return {
      dhd: dhd,
      dhp: dhp,
      updateData: updateData,
      updateItems: updateItems
    }
  }

  /* -------------------------------------------- */

  /**
   * Take a long rest, recovering HP, HD, resources, and spell slots
   * @param {boolean} dialog  Present a confirmation dialog window whether or not to take a long rest
   * @param {boolean} chat    Summarize the results of the rest workflow as a chat message
   * @return {Promise}        A Promise which resolves once the long rest workflow has completed
   */
  async longRest({dialog=true, chat=true}={}) {
    const data = this.data.data;

    // Maybe present a confirmation dialog
    if ( dialog ) {
      try {
        await ShortRestDialog.longRestDialog(this);
      } catch(err) {
        return;
      }
    }

    // Recover hit points to full, and eliminate any existing temporary HP
    const dhp = data.attributes.hp.max - data.attributes.hp.value;
    const updateData = {
      "data.attributes.hp.value": data.attributes.hp.max,
      "data.attributes.hp.temp": 0,
      "data.attributes.hp.tempmax": 0
    };

    // Recover character resources
    for ( let [k, r] of Object.entries(data.resources) ) {
      if ( r.max && (r.sr || r.lr) ) {
        updateData[`data.resources.${k}.value`] = r.max;
      }
    }

    // Recover spell slots
    for ( let [k, v] of Object.entries(data.spells) ) {
      if ( !v.max ) continue;
      updateData[`data.spells.${k}.value`] = v.max;
    }


    // Determine the number of hit dice which may be recovered
    let recoverHD = Math.max(Math.floor(data.details.level / 2), 1);
    let dhd = 0;

    // Sort classes which can recover HD, assuming players prefer recovering larger HD first.
    const updateItems = this.items.filter(item => item.data.type === "class").sort((a, b) => {
      let da = parseInt(a.data.data.hitDice.slice(1)) || 0;
      let db = parseInt(b.data.data.hitDice.slice(1)) || 0;
      return db - da;
    }).reduce((updates, item) => {
      const d = item.data.data;
      if ( (recoverHD > 0) && (d.hitDiceUsed > 0) ) {
        let delta = Math.min(d.hitDiceUsed || 0, recoverHD);
        recoverHD -= delta;
        dhd += delta;
        updates.push({_id: item.id, "data.hitDiceUsed": d.hitDiceUsed - delta});
      }
      return updates;
    }, []);

    // Iterate over owned items, restoring uses per day and recovering Hit Dice
    for ( let item of this.items ) {
      const d = item.data.data;
      if ( d.uses && ["sr", "lr"].includes(d.uses.per) ) {
        updateItems.push({_id: item.id, "data.uses.value": d.uses.max});
      }
      else if ( d.recharge && d.recharge.value ) {
        updateItems.push({_id: item.id, "data.recharge.charged": true});
      }
    }

    // Perform the updates
    await this.update(updateData);
    if ( updateItems.length ) await this.updateManyEmbeddedEntities("OwnedItem", updateItems);

    // Display a Chat Message summarizing the rest effects
    if ( chat ) {
      ChatMessage.create({
        user: game.user._id,
        speaker: {actor: this, alias: this.name},
        content: `${this.name} takes a long rest and recovers ${dhp} Hit Points and ${dhd} Hit Dice.`
      });
    }

    // Return data summarizing the rest effects
    return {
      dhd: dhd,
      dhp: dhp,
      updateData: updateData,
      updateItems: updateItems
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply rolled dice damage to the token or tokens which are currently controlled.
   * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
   *
   * @param {HTMLElement} roll    The chat entry which contains the roll data
   * @param {Number} multiplier   A damage multiplier to apply to the rolled damage.
   * @return {Promise}
   */
  static async applyDamage(roll, multiplier) {
    let value = Math.floor(parseFloat(roll.find('.dice-total').text()) * multiplier);
    const promises = [];
    for ( let t of canvas.tokens.controlled ) {
      let a = t.actor,
          hp = a.data.data.attributes.hp,
          tmp = parseInt(hp.temp) || 0,
          dt = value > 0 ? Math.min(tmp, value) : 0;
      promises.push(t.actor.update({
        "data.attributes.hp.temp": tmp - dt,
        "data.attributes.hp.value": Math.clamped(hp.value - (value - dt), 0, hp.max)
      }));
    }
    return Promise.all(promises);
  }
}

