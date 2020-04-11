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

  /* -------------------------------------------- */

  /**
   * Provide data to the HTML template for rendering
   * @type {Object}
   */
  getData() {

    // Get current values
    let attr = getProperty(this.object.data, this.attribute);
    console.log(attr);

	  // Populate choices
    const choices = duplicate(this.options.choices);
    for ( let [k, v] of Object.entries(choices) ) {
      choices[k] = {
        label: v.name,
        chosen: Object.keys(attr).includes(k)
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
    console.log(formData);
    const choices = {};
    for ( let [k, v] of Object.entries(formData) ) {
      if (k==="7EXeINoWtrgDDX9I") debugger;
      if ( v ) choices[k] = Object.assign({},game.data.items.find(a => a._id === k));
      if ( !v ) delete (this.object.data[this.attribute][k]);
    }
    this.object.update({
      [this.attribute]: choices
    });
  }
}
