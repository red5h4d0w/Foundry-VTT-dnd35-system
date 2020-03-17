export class ActorSheetFlags extends BaseEntitySheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return mergeObject(options, {
      id: "actor-flags",
	    classes: ["dnd35e"],
      template: "systems/dnd35e/templates/apps/actor-flags.html",
      width: 500,
      closeOnSubmit: true
    });
  }

  /* -------------------------------------------- */

  /**
   * Configure the title of the special traits selection window to include the Actor name
   * @type {String}
   */
  get title() {
    return `${game.i18n.localize('DND35E.FlagsTitle')}: ${this.object.name}`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data used to render the special Actor traits selection UI
   * @return {Object}
   */
  getData() {
    const data = super.getData();
    data.actor = this.object;
    data.flags = this._getFlags();
    data.bonuses = this._getBonuses();
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Prepare an object of flags data which groups flags by section
   * Add some additional data for rendering
   * @return {Object}
   */
  _getFlags() {
    const flags = {};
    for ( let [k, v] of Object.entries(CONFIG.DND35E.characterFlags) ) {
      if ( !flags.hasOwnProperty(v.section) ) flags[v.section] = {};
      let flag = duplicate(v);
      flag.type = v.type.name;
      flag.isCheckbox = v.type === Boolean;
      flag.isSelect = v.hasOwnProperty('choices');
      flag.value = this.entity.getFlag("dnd35e", k);
      flags[v.section][`flags.dnd35e.${k}`] = flag;
    }
    return flags;
  }

  /* -------------------------------------------- */

  /**
   * Get the bonuses fields and their localization strings
   * @return {Array}
   * @private
   */
  _getBonuses() {
    const bonuses = [
      {name: "data.bonuses.mwak.attack", label: "DND35E.BonusMWAttack"},
      {name: "data.bonuses.mwak.damage", label: "DND35E.BonusMWDamage"},
      {name: "data.bonuses.rwak.attack", label: "DND35E.BonusRWAttack"},
      {name: "data.bonuses.rwak.damage", label: "DND35E.BonusRWDamage"},
      {name: "data.bonuses.msak.attack", label: "DND35E.BonusMSAttack"},
      {name: "data.bonuses.msak.damage", label: "DND35E.BonusMSDamage"},
      {name: "data.bonuses.rsak.attack", label: "DND35E.BonusRSAttack"},
      {name: "data.bonuses.rsak.damage", label: "DND35E.BonusRSDamage"},
      {name: "data.bonuses.abilities.check", label: "DND35E.BonusAbilityCheck"},
      {name: "data.bonuses.abilities.save", label: "DND35E.BonusAbilitySave"},
      {name: "data.bonuses.abilities.skill", label: "DND35E.BonusAbilitySkill"},
      {name: "data.bonuses.spell.dc", label: "DND35E.BonusSpellDC"}
    ];
    for ( let b of bonuses ) {
      b.value = getProperty(this.object.data, b.name) || "";
    }
    return bonuses;
  }

  /* -------------------------------------------- */

  /**
   * Update the Actor using the configured flags
   * Remove/unset any flags which are no longer configured
   */
  _updateObject(event, formData) {
    const actor = this.object;
    const updateData = expandObject(formData);

    // Unset any flags which are "false"
    const flags = updateData.flags.dnd35e;
    for ( let [k, v] of Object.entries(flags) ) {
      if ( [undefined, null, "", false, 0].includes(v) ) {
        delete flags[k];
        flags[`-=${k}`] = null;
      }
    }

    // Apply the changes
    return actor.update(updateData);
  }
}
