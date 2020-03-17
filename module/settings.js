export const registerSystemSettings = function() {

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("dnd35e", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  /**
   * Register diagonal movement rule setting
   */
  game.settings.register("dnd35e", "diagonalMovement", {
    name: "SETTINGS.35eDiagN",
    hint: "SETTINGS.35eDiagL",
    scope: "world",
    config: true,
    default: "555",
    type: String,
    choices: {
      "555": "SETTINGS.35eDiagPHB",
      "5105": "SETTINGS.35eDiagDMG"
    },
    onChange: rule => canvas.grid.diagonalRule = rule
  });

  /**
   * Register Initiative formula setting
   */
  function _set35eInitiative(tiebreaker) {
    CONFIG.Combat.initiative.tiebreaker = tiebreaker;
    CONFIG.Combat.initiative.decimals = tiebreaker ? 2 : 0;
    if ( ui.combat && ui.combat._rendered ) ui.combat.render();
  }
  game.settings.register("dnd35e", "initiativeDexTiebreaker", {
    name: "SETTINGS.35eInitTBN",
    hint: "SETTINGS.35eInitTBL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: enable => _set35eInitiative(enable)
  });
  _set35eInitiative(game.settings.get("dnd35e", "initiativeDexTiebreaker"));

  /**
   * Require Currency Carrying Weight
   */
  game.settings.register("dnd35e", "currencyWeight", {
    name: "SETTINGS.35eCurWtN",
    hint: "SETTINGS.35eCurWtL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  /**
   * Option to disable XP bar for session-based or story-based advancement.
   */
  game.settings.register("dnd35e", "disableExperienceTracking", {
    name: "SETTINGS.35eNoExpN",
    hint: "SETTINGS.35eNoExpL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });

  /**
   * Option to automatically create Spell Measured Template on roll
   */
  game.settings.register("dnd35e", "alwaysPlaceSpellTemplate", {
    name: "SETTINGS.35eAutoSpellTemplateN",
    hint: "SETTINGS.35eAutoSpellTemplateL",
    scope: "client",
    config: true,
    default: false,
    type: Boolean
  });

  /**
   * Option to automatically collapse Item Card descriptions
   */
  game.settings.register("dnd35e", "autoCollapseItemCards", {
    name: "SETTINGS.35eAutoCollapseCardN",
    hint: "SETTINGS.35eAutoCollapseCardL",
    scope: "client",
    config: true,
    default: false,
    type: Boolean,
    onChange: s => {
      ui.chat.render();
    }
  });
};
