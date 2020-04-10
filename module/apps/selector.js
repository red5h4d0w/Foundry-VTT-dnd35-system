/**
 * A specialized form used to select damage or condition types which apply to an Actor
 * @type {FormApplication}
 */
export class Selector extends FormApplication {
	static get defaultOptions() {
	  const options = super.defaultOptions;
	  options.id = "trait-selector";
	  options.classes = ["dnd35e"];
	  options.title = "Actor Trait Selection";
	  options.template = "systems/dnd35e/templates/apps/trait-selector.html";
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

	  // Populate choices
    const choices = duplicate(this.options.choices);
    for ( let [k, v] of Object.entries(choices) ) {
      choices[k] = {
        label: v,
        chosen: attr.keys.includes(k)
      }
    }

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
    const choices = [];
    for ( let [k, v] of Object.entries(formData) ) {
      if ( v ) choices[k] = v;
    }
    this.object.update({
      [this.attribute]: choices,
    });
  }
}
