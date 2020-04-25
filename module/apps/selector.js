/**
 * A specialized form used to select damage or condition types which apply to an Actor
 * @type {FormApplication}
 */
export class Selector extends FormApplication {
	static get defaultOptions() {
	  const options = super.defaultOptions;
	  options.id = "trait-selector";
	  options.classes = ["dnd35e"];
    options.title = "Item/Spell Selection";
    options.type = "item"
	  options.template = "systems/dnd35e/templates/apps/selector.html";
	  options.width = 320;
	  options.height = "auto";
	  return options;
  }

  /* -------------------------------------------- */

  /**
   * Return a reference to the target attribute
   * @type {String}
   */
  get attribute() {
	  return this.options.name;
  }

  get delattribute() {
    const index = this.attribute.lastIndexOf(".")
    return (this.attribute.substring(0,index+1)+"-="+ this.attribute.substring(index+1))
  }

  /* -------------------------------------------- */

  /**
   * Provide data to the HTML template for rendering
   * @type {Object}
   */
  getData() {

    // Get current values
    let attr = getProperty(this.object.data, this.attribute);

	  // Populate choices
    const choices = duplicate(this.options.choices);
    for ( let [k, v] of Object.entries(choices) ) {
      choices[k] = {
        label: v.name,
        chosen: !!attr[k]
      };
    };

    // Return data
	  return {
	    choices: choices
    }
  }

  /* -------------------------------------------- */

  /**
   * Update the Actor/Item object with new data processed from the form
   * @private
   */
  _updateObject(event, formData) {
    const choices = {};
    const updateData = {};
    for ( let [k, v] of Object.entries(formData) ) {
      if (this.options.type === "item") {
        if ( v ) choices[k] = Object.assign({},game.data.items.find(a => a._id === k));
      }
      else if (this.options.type === "trait"){
        if ( v ) choices[k] = v;
      };
      if ( !v ) updateData[this.delattribute + "." + k] = null;
    };
    updateData[this.attribute] = choices;
    this.object.update(updateData);
  }
}
