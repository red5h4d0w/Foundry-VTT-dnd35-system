export class Dice35e {

  /**
   * A standardized helper function for managing core 3.5e "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
   *
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Object} data           Actor or item data against which to parse the roll
   * @param {Event|object} event    The triggering event which initiated the roll
   * @param {string|null} template  The HTML template used to render the roll dialog
   * @param {string|null} title     The dice roll UI window title
   * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {string|null} flavor    Flavor text to use in the posted chat message
   * @param {Boolean} fastForward   Allow fast-forward advantage selection
   * @param {number} critical       The value of d20 result which represents a critical success
   * @param {number} fumble         The value of d20 result which represents a critical failure
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   *
   * @return {Promise}              A Promise which resolves once the roll workflow has completed
   */
  static async d20Roll({parts=[], data={}, event={}, rollMode=null, template=null, title=null, speaker=null,
                        flavor=null, onClose, dialogOptions, 
                        critical=20, fumble=1}={}) {

    // Handle input arguments
    flavor = flavor || title;
    speaker = speaker || ChatMessage.getSpeaker();
    rollMode = rollMode || game.settings.get("core", "rollMode");
    parts = parts.concat(["@bonus"]);
    let rolled = false;

    // Define inner roll function
    const _roll = function(parts, form=null) {

      // Include the d20 roll
      parts.unshift('1d20');

      // Optionally include a situational bonus
      if ( form !== null ) data['bonus'] = form.bonus.val();

      // Execute the roll and flag critical thresholds on the d20
      let roll = new Roll(parts.join(" + "), data).roll();
      const d20 = roll.parts[0];
      d20.options.critical = critical;
      d20.options.fumble = fumble;

      // Convert the roll to a chat message and return the roll
      rollMode = form ? form.rollMode.value : rollMode;
      roll.toMessage({
        speaker: speaker,
        flavor: flavor
        }, { rollMode });
      rolled = true;
      return roll;
    };

    // Render modal dialog
    template = template || "systems/dnd35e/templates/chat/roll-dialog.html";
    let dialogData = {
      formula: parts.join(" + "),
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.rollModes,
      config: CONFIG.DND35E
    };
    const html = await renderTemplate(template, dialogData);

    // Create the Dialog window
    let roll;
    return new Promise(resolve => {
      new Dialog({
        title: title,
        content: html,
        buttons: {
          normal: {
            label: game.i18n.localize("DND35E.RollExclamation"),
            callback: html => roll = _roll(parts, html[0].children[0])
          }
        },
        default: "normal",
        close: html => {
          if (onClose) onClose(html, parts, data);
          resolve(rolled ? roll : false)
        }
      }, dialogOptions).render(true);
    })
  }

  /* -------------------------------------------- */

  /**
   * A standardized helper function for managing core 3.5e "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
   *
   * @param {Event|object} event    The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Actor} actor           The Actor making the damage roll
   * @param {Object} data           Actor or item data against which to parse the roll
   * @param {String} template       The HTML template used to render the roll dialog
   * @param {String} title          The dice roll UI window title
   * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {string} flavor         Flavor text to use in the posted chat message
   * @param {Boolean} critical      Allow critical hits to be chosen
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   *
   * @return {Promise}              A Promise which resolves once the roll workflow has completed
   */
  static async damageRoll({event={}, parts, actor, data, template, title, speaker, flavor, critical=true, onClose,
                            dialogOptions}) {

    // Handle input arguments
    flavor = flavor || title;
    speaker = speaker || ChatMessage.getSpeaker();
    const rollMode = game.settings.get("core", "rollMode");
    let rolled = false;

    // Define inner roll function
    const _roll = function(parts, crit, form) {
      data['bonus'] = form ? form.find('[name="bonus"]').val() : 0;
      let roll = new Roll(parts.join("+"), data);

      // Modify the damage formula for critical hits
      if ( crit === true ) {
        let add = (actor && actor.getFlag("dnd35e", "savageAttacks")) ? 1 : 0;
        let mult = 2;
        roll.alter(add, mult);
        flavor = `${flavor} (Critical)`;
      }

      // Convert the roll to a chat message
      roll.toMessage({
        speaker: speaker,
        flavor: flavor,
        rollMode: form ? form.find('[name="rollMode"]').val() : rollMode
      });
      rolled = true;
      return roll;
    };

    // Modify the roll and handle fast-forwarding
    if ( event.shiftKey || event.ctrlKey || event.metaKey || event.altKey ) return _roll(parts, event.altKey);
    else parts = parts.concat(["@bonus"]);

    // Render modal dialog
    template = template || "systems/dnd35e/templates/chat/roll-dialog.html";
    let dialogData = {
      formula: parts.join(" + "),
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.rollModes
    };
    const html = await renderTemplate(template, dialogData);

    // Create the Dialog window
    let roll;
    return new Promise(resolve => {
      new Dialog({
        title: title,
        content: html,
        buttons: {
          critical: {
            condition: critical,
            label: "Critical Hit",
            callback: html => roll = _roll(parts, true, html)
          },
          normal: {
            label: critical ? "Normal" : "Roll",
            callback: html => roll = _roll(parts, false, html)
          },
        },
        default: "normal",
        close: html => {
          if (onClose) onClose(html, parts, data);
          resolve(rolled ? roll : false);
        }
      }, dialogOptions).render(true);
    });
  }
}
