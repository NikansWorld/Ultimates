"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const __1 = require("../..");
const config_1 = require("../../models/config");
const Event_1 = require("../../structures/Event");
exports.default = new Event_1.Event('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit())
        return;
    if (interaction.customId === 'add-badwords') {
        const words = interaction.fields.getTextInputValue('input');
        const currentWords = (await config_1.configModel.findById('automod')).filteredWords;
        const removed = [];
        const input = words
            .split(',')
            .map((word) => {
            if (currentWords.includes(word.trim().toUpperCase())) {
                currentWords.splice(currentWords.indexOf(word.trim().toUpperCase()));
                removed.push(word);
                word = null;
            }
            return word !== null ? word?.trim()?.toUpperCase() : 'null';
        })
            .filter((word) => word !== 'null');
        await config_1.configModel.findByIdAndUpdate('automod', {
            $set: {
                filteredWords: currentWords.concat(input),
            },
        });
        await __1.client.config.updateAutomod();
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder({
                    description: `Added **${input.length}** and removed **${removed.length}** words.`,
                    color: __1.client.cc.successC,
                }),
            ],
            ephemeral: true,
        });
    }
    if (interaction.customId.startsWith('add-reason')) {
        const words = interaction.fields.getTextInputValue('input');
        const module = interaction.customId.replaceAll('add-reason-', '');
        const currentReasons = (await config_1.configModel.findById('moderation')).reasons[module];
        const removed = [];
        const input = words
            .split('--')
            .map((reason) => {
            // Checking if a reason already exists
            if (currentReasons
                .map((r) => r.toUpperCase())
                .includes(reason.trim().toUpperCase())) {
                currentReasons
                    .map((r) => r.toUpperCase())
                    .splice(currentReasons.indexOf(reason.trim().toUpperCase()));
                removed.push(reason);
                reason = null;
            }
            return reason !== null ? reason?.trim() : 'null';
        })
            .filter((word) => word !== 'null');
        await config_1.configModel.findByIdAndUpdate('moderation', {
            $set: {
                reasons: {
                    ...(await config_1.configModel.findById('moderation')).reasons,
                    [module]: currentReasons.concat(input),
                },
            },
        });
        await __1.client.config.updateModeration();
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder({
                    description: `Added **${input.length}** and removed **${removed.length}** reasons.`,
                    color: __1.client.cc.successC,
                }),
            ],
            ephemeral: true,
        });
    }
});
