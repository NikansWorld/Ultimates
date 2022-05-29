"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warningsCommand = void 0;
const discord_js_1 = require("discord.js");
exports.warningsCommand = {
    name: 'warnings',
    description: 'View your active punishments in this server',
    directory: 'moderation',
    cooldown: 5000,
    permission: [],
    available: true,
    options: [
        {
            name: 'type',
            description: 'Filter the warnings being shown',
            type: discord_js_1.ApplicationCommandOptionType.Number,
            required: false,
            choices: [
                {
                    name: 'Manual warnings',
                    value: 1,
                },
                {
                    name: 'Auto moderation warnings',
                    value: 2,
                },
            ],
        },
    ],
};
