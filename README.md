# Foundry VTT D&D 3.5th Edition

An implementation of the Dungeons & Dragons 3.5th Edition game system for [Foundry Virtual Tabletop](http://foundryvtt.com).

The software component of this system is distributed under the GNUv3 license while the game content is distributed
under the Open Gaming License v1.0a.

The [Systems Reference Document (SRD)](http://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf) for included
content is available in full from Wizards of the Coast.

## Installation Instructions

To install the D&D3.5E system for Foundry Virtual Tabletop, simply paste the following URL into the **Install System**
dialog on the Setup menu of the application.

https://raw.githubusercontent.com/red5h4d0w/Foundry-VTT-dnd35-system/master/system.json

If you wish to manually install the system, you must clone or extract it into the ``Data/systems/dnd35e`` folder. You
may do this by cloning the repository or downloading a zip archive from the

https://github.com/red5h4d0w/Foundry-VTT-dnd35-system/archive/master.zip

## Attribution

The vast majority of this system is based on D&D5 system by Foundry Network (specifically Atropos)
https://gitlab.com/foundrynet/dnd5e

Also, some elements were borrowed from the Combat Utility Belt by death-save
https://github.com/death-save/combat-utility-belt

## Community Contribution

Code and content contributions are accepted. Please feel free to submit issues to the issue tracker or submit merge
requests for code changes. Approval for such requests involves code and (if necessary) design review by red5h4d0w. Please
reach out on the Foundry Community Discord with any questions.


///        {{!-- Details Tab --}}
        <div class="tab details" data-group="primary" data-tab="details">

            <h3 class="form-header">Feature Usage</h3>

            {{!-- Item Activation Template --}}
            {{> "systems/dnd35e/templates/items/parts/item-activation.html"}}

            {{!-- Recharge Requirement --}}
            {{#if data.activation.type}}
            <div class="form-group recharge">
                <label>Action Recharge</label>
                <div class="form-fields">
                    <span>Recharge On</span>
                    <input type="text" name="data.recharge.value" value="{{data.recharge.value}}"
                           data-dtype="Number" placeholder="1d6 Result"/>
                    <label class="checkbox">
                        Charged
                        <input type="checkbox" name="data.recharge.charged" {{checked data.recharge.charged}}/>
                    </label>
                </div>
            </div>
            {{/if}}

            <h3 class="form-header">Feature Attack</h3>

            {{!-- Item Action Template --}}
            {{> "systems/dnd35e/templates/items/parts/item-action.html"}}