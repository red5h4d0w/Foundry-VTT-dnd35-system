
export class Combat35e extends Combat{

    static hookOnDeleteCombat(combat, combatId, options, userId){
        if (game.settings.xpModule && game.userId == userId) {
            combat.giveXP;
        }
    };

    _getInitiativeFormula = function(combatant) {
        const actor = combatant.actor;
        if ( !actor ) return "1d20";
        const init = actor.data.data.attributes.init;
        const parts = ["1d20", init.mod, (init.bonus !== 0) ? init.bonus : null];
        if ( CONFIG.Combat.initiative.tiebreaker ) parts.push(actor.data.data.abilities.dex.value / 100);
        return parts.filter(p => p !== null).join(" + ");
    };

    giveXP() {
        const defeatedEnemies = this.turns.filter(object => (!object.actor.isPC && object.defeated && object.token.disposition === -1));
        const players = this.turns.filter(object => (object.actor.isPC && !object.defeated));
        if (players.length > 0) {
            let experienceMessage = "<b>Experience Awarded!</b><p>";
            for (i = 0; i < players.length; i++){
                player = players[i]
                const actor = game.actors.entities.find(actor => actor._id === player.actor.data._id);
                let experience = 0;
                defeatedEnemies.forEach(enemy =>{
                    experience += enemy.actor.data.data.details.xp.value[i];
                });
                actor.update({
                    "data.details.xp.value": player.actor.data.data.details.xp.value + experience
                });
                experienceMessage += "<br>" + player.actor.data.name + "is awarded " + experience +" xp</br>";
            }
            experienceMessage += "</p>";
            ChatMessage.create({
                user: game.user._id,
                speaker: {
                    alias: "GM Experience Service"
                },
                content: experienceMessage,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }
    }
}