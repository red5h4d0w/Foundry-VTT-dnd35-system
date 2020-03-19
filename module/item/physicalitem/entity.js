import { Item35e } from "../entity.js";

export class PhysicalItem35e extends Item35e {

  /**
   * Does the item provide an amount of healing instead of conventional damage?
   * @return {boolean}
   */
  get isHealing() {
    return !!(this.data.data.actionType === "heal") && this.data.data.damage.parts.length;
  }

  /**
  * Does the Item implement a versatile damage roll as part of its usage
  * @type {boolean}
  */
  get isVersatile() {
    return !!(this.hasDamage && this.data.data.damage.versatile);
  }
  /* -------------------------------------------- */
}