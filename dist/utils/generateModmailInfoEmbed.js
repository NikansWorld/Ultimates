"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModmailInfoEmbed = void 0;
const __1 = require("..");
const config_json_1 = require("../json/config.json");
async function generateModmailInfoEmbed(user) {
    const guild = __1.client.guilds.cache.get(config_json_1.guild.id) ||
        (await __1.client.guilds.fetch(config_json_1.guild.id));
    const guildMember = (await guild.members.fetch(user.id));
    return __1.client.util
        .embed()
        .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL(),
    })
        .setColor(__1.client.cc.ultimates)
        .setDescription(`${user} • ID: ${user.id}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields({
        name: 'Account Information',
        value: [
            `• **Username:** ${user.tag}`,
            `• **ID:** ${user.id}`,
            `• **Registered:** <t:${~~(+user?.createdAt / 1000)}:f> | <t:${~~(+user?.createdAt / 1000)}:R>`,
        ].join('\n'),
    }, {
        name: 'Server Information',
        value: [
            `• **Joined**: <t:${~~(+guildMember.joinedAt / 1000)}:f> | <t:${~~(+guildMember.joinedAt / 1000)}:R>`,
            `• **Nickname**: ${user.username == guildMember.displayName
                ? `No Nickname`
                : guildMember.displayName}`,
        ].join('\n'),
    });
}
exports.generateModmailInfoEmbed = generateModmailInfoEmbed;