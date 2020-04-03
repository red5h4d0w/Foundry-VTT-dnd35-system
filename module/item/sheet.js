import { AbilityUseDialog } from "../apps/ability-use-dialog.js";

/**
 * Override and extend the core ItemSheet implementation to handle D&D3.5e specific item types
 * @type {ItemSheet}
 */
export class ItemSheet35e extends ItemSheet {


	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      width: 560,
      height: 420,
      classes: ["dnd35e", "sheet", "item"],
      resizable: false,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /* -------------------------------------------- */

  /**
   * Return a dynamic reference to the HTML template path used to render this Item Sheet
   * @return {string}
   */
  get template() {
    const path = "systems/dnd35e/templates/items";
    console.log(`${path}/${this.item.data.type}/${this.item.data.type}-sheet.html`);
    return `${path}/${this.item.data.type}/${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare item sheet data
   * Start with the base item data and extending with additional properties for rendering.
   */
  getData() {
    const data = super.getData();
    data.labels = this.item.labels;
    
    // Include CONFIG values
    data.config = CONFIG.DND35E;

    // Item Type, Status, and Details
    data.itemType = data.item.type.titleCase();
    data.itemStatus = this._getItemStatus(data.item);
    data.itemProperties = this._getItemProperties(data.item);
    data.isPhysical = data.item.data.hasOwnProperty("quantity");



    // Action Details
    data.hasAttackRoll = this.item.hasAttack;
    data.isHealing = data.item.data.actionType === "heal";
    data.isFlatDC = getProperty(data.item.data, "save.scaling") === "flat";
    data.hasCustomRange = this.hasCustomRange;
    data.hasGridView = this.hasGridView;
    data.hasListView = this.hasListView;
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
   * @return {string}
   * @private
   */
  _getItemStatus(item) {
    if ( ["weapon", "equipment"].includes(item.type) ) return item.data.equipped ? "Equipped" : "Unequipped";
  }

  /* -------------------------------------------- */

  /**
   * Get the Array of item properties which are used in the small sidebar of the description tab
   * @return {Array}
   * @private
   */
  _getItemProperties(item) {
    const props = [];
    const labels = this.item.labels;

    if ( item.type === "weapon" ) {
      props.push(...Object.entries(item.data.properties)
        .filter(e => e[1] === true)
        .map(e => CONFIG.DND35E.weaponProperties[e[0]]));
    }

    else if ( item.type === "spell" ) {
      props.push(
        labels.components,
        labels.materials
      )
    }

    else if ( item.type === "equipment" ) {
      props.push(CONFIG.DND35E.equipmentTypes[item.data.armor.type]);
      props.push(labels.armor);
    }

    // Action type
    if ( item.data.actionType ) {
      props.push(CONFIG.DND35E.itemActionTypes[item.data.actionType]);
    }

    // Action usage
    if ( (item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation) ) {
      props.push(
        labels.activation,
        labels.range,
        labels.target,
        labels.duration
      )
    }
    return props.filter(p => !!p);
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(position={}) {
    position.height = this._tabs[0].active === "details" ? "auto" : this.options.height;
    return super.setPosition(position);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
	/* -------------------------------------------- */

  /**
   * Extend the parent class _updateObject method to ensure that damage ends up in an Array
   * @private
   */
  _updateObject(event, formData) {

    // Handle Damage Array
    let damage = Object.entries(formData).filter(e => e[0].startsWith("data.damage.parts"));
    formData["data.damage.parts"] = damage.reduce((arr, entry) => {
      let [i, j] = entry[0].split(".").slice(3);
      if ( !arr[i] ) arr[i] = [];
      arr[i][j] = entry[1];
      return arr;
    }, []);

    // Update the Item
    super._updateObject(event, formData);
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for interactive item sheet events
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Modify damage formula
    html.find(".damage-control").click(this._onDamageControl.bind(this));
    // Adds the dialog box to add new item
    html.find(".add-item").click(this._addItemFromList.bind(this));
  }

  /* -------------------------------------------- */

  get hasCustomRange() {
    const data = super.getData();
    if (typeof data.item.data.range === "undefined"){
      return false;

    }
    else{
      return !!(data.item.data.range.type === "custom");
    };
  };

  get hasListView() {
    const data = super.getData();
    if (typeof data.item.data.view === "undefined"){
      return false;

    }
    else{
      return !!(data.item.data.view === "list");
    };
  };
  get hasGridView() {
    const data = super.getData();
    if (typeof data.item.data.view === "undefined"){
      return false;

    }
    else{
      return !!(data.item.data.view === "icongrid");
    };
  };

  /**
   * Add or remove a damage part from the damage formula
   * @param {Event} event     The original click event
   * @return {Promise}
   * @private
   */
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new damage component
    if ( a.classList.contains("add-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const damage = this.item.data.data.damage;
      return this.item.update({"data.damage.parts": damage.parts.concat([["", ""]])});
    }

    // Remove a damage component
    if ( a.classList.contains("delete-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".damage-part");
      const damage = duplicate(this.item.data.data.damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      return this.item.update({"data.damage.parts": damage.parts});
    }
  }; 

  async _addItemFromList(event) {
    event.preventDefault();
    return new Dialog({
      "title": "Not implemented yet",
      "content": "<p>not implemented yet</p>"
    })
  }

  async _onDrop(event) {
    event.preventDefault();
    const itemdata = super.getData();
    // Get dropped data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }

    console.log("this gets executed")
    console.log(data)
    if (itemdata.item.data.type === "backpack") {
      itemdata.item.data.data.addItemToBackpack(data);
    };
    // Call parent on drop logic
    return super._onDrop(event);
  };
}
