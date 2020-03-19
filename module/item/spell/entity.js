import { Item35e } from "../entity.js";

export class Spell35e extends Item35e {

  /**
   * Does the item provide an amount of healing instead of conventional damage?
   * @return {boolean}
   */
  get isHealing() {
    return !!(this.data.data.actionType === "heal") && this.data.data.damage.parts.length;
  }

}