import { ComponentType, EmbedBuilder, Message, User } from 'discord.js';
import { interactions } from '../../interactions';
import { automodModel } from '../../models/automod';
import { punishmentModel } from '../../models/punishments';
import { Command } from '../../structures/Command';
import { PunishmentType } from '../../typings/PunishmentType';
import { generateDiscordTimestamp } from '../../utils/generateDiscordTimestamp';

export default new Command({
	interaction: interactions.warnings,
	excute: async ({ client, interaction, options }) => {
		const user = interaction.user as User;
		const warningsEmbed = new EmbedBuilder()
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.setColor(client.cc.invisible)
			.setThumbnail(user.displayAvatarURL());

		// Finding the warnings [option]
		const optionChoice = options.getNumber('type');
		var warningsMap: string[] = [];
		if (!optionChoice) {
			const findWarningsNormal = await punishmentModel.find({
				userId: user.id,
			});
			const findWarningsAutomod = await automodModel.find({ userId: user.id });
			let warnCounter = 0;

			findWarningsNormal.forEach((data) => {
				warnCounter = warnCounter + 1;
				warningsMap.push(
					[
						`\`${warnCounter}\` **${client.util.capitalize(
							data.type
						)}** | **ID: ${data._id}**`,
						`• **Date:** ${generateDiscordTimestamp(
							data.date,
							'Short Date/Time'
						)}`,
						data.type === PunishmentType.Warn
							? `• **Expire:** ${generateDiscordTimestamp(data.expire)}`
							: 'LINE_BREAK',
						`• **Reason:** ${data.reason}`,
					]
						.join('\n')
						.replaceAll('\nLINE_BREAK', '')
				);
			});
			findWarningsAutomod.forEach((data) => {
				warnCounter = warnCounter + 1;
				warningsMap.push(
					[
						`\`${warnCounter}\` **${client.util.capitalize(
							data.type
						)}** | Auto Moderation`,
						`• **Date:** ${generateDiscordTimestamp(
							data.date,
							'Short Date/Time'
						)}`,
						data.type === PunishmentType.Warn
							? `• **Expire:** ${generateDiscordTimestamp(data.expire)}`
							: 'LINE_BREAK',
						`• **Reason:** ${data.reason}`,
					]
						.join('\n')
						.replaceAll('\nLINE_BREAK', '')
				);
			});
		} else if (optionChoice === 1) {
			const findWarningsNormal = await punishmentModel.find({
				userId: user.id,
			});
			let warnCounter = 0;
			warningsMap = findWarningsNormal.map((data) => {
				warnCounter = warnCounter + 1;
				return [
					`\`${warnCounter}\` **${client.util.capitalize(data.type)}** | **ID: ${
						data._id
					}**`,
					`• **Date:** ${generateDiscordTimestamp(data.date, 'Short Date/Time')}`,
					data.type === PunishmentType.Warn
						? `• **Expire:** ${generateDiscordTimestamp(data.expire)}`
						: 'LINE_BREAK',
					`• **Reason:** ${data.reason}`,
				]
					.join('\n')
					.replaceAll('\nLINE_BREAK', '');
			});
		} else if (optionChoice === 2) {
			const findWarningsAutomod = await automodModel.find({ userId: user.id });
			let warnCounter = 0;

			warningsMap = findWarningsAutomod.map((data) => {
				warnCounter = warnCounter + 1;
				return [
					`\`${warnCounter}\` **${client.util.capitalize(
						data.type
					)}** | Auto Moderation`,
					`• **Date:** ${generateDiscordTimestamp(data.date, 'Short Date/Time')}`,
					data.type === PunishmentType.Warn
						? `• **Expire:** ${generateDiscordTimestamp(data.date)}`
						: 'LINE_BREAK',
					`• **Reason:** ${data.reason}`,
				]
					.join('\n')
					.replaceAll('\nLINE_BREAK', '');
			});
		}

		// Sending the results
		if (warningsMap.length === 0)
			return interaction.reply({
				embeds: [
					new EmbedBuilder({
						description: `No ${
							optionChoice ? (optionChoice === 1 ? 'manual ' : 'automod ') : ''
						}warnings were found for you, you're clean!`,
						color: client.cc.invisible,
					}),
				],
				ephemeral: true,
			});

		await interaction.deferReply();
		if (warningsMap.length <= 3) {
			warningsEmbed.setDescription(
				warningsMap.map((data) => data.toString()).join('\n\n')
			);
			interaction.followUp({ embeds: [warningsEmbed] });
		} else if (warningsMap.length > 3) {
			const totalPages = Math.ceil(warningsMap.length / 3);
			let currentSlice1 = 0;
			let currentSlice2 = 3;
			let currentPage = 1;
			let sliced = warningsMap
				.map((data) => data.toString())
				.slice(currentSlice1, currentSlice2);

			warningsEmbed
				.setDescription(sliced.join('\n\n'))
				.setFooter({ text: `Page ${currentPage}/${totalPages}` });
			var sentInteraction = (await interaction.followUp({
				embeds: [warningsEmbed],
				components: [client.util.build.paginator()],
			})) as Message;

			const collector = sentInteraction.createMessageComponentCollector({
				time: 60000,
				componentType: ComponentType['Button'],
			});

			collector.on('collect', (collected): any => {
				if (interaction.user.id !== collected.user.id)
					return collected.reply({
						content: 'You can not use this.',
						ephemeral: true,
					});

				switch (collected.customId) {
					case '1':
						if (currentPage === 1) return collected.deferUpdate();

						currentSlice1 = currentSlice1 - 3;
						currentSlice2 = currentSlice2 - 3;
						currentPage = currentPage - 1;
						sliced = warningsMap
							.map((data) => data.toString())
							.slice(currentSlice1, currentSlice2);
						warningsEmbed
							.setDescription(
								sliced.map((data) => data.toString()).join('\n\n')
							)
							.setFooter({ text: `Page ${currentPage}/${totalPages}` });

						interaction.editReply({ embeds: [warningsEmbed] });
						collected.deferUpdate();
						break;
					case '2':
						if (currentPage === totalPages) return collected.deferUpdate();

						currentSlice1 = currentSlice1 + 3;
						currentSlice2 = currentSlice2 + 3;
						currentPage = currentPage + 1;
						sliced = warningsMap
							.map((data) => data.toString())
							.slice(currentSlice1, currentSlice2);
						warningsEmbed
							.setDescription(
								sliced.map((data) => data.toString()).join('\n\n')
							)
							.setFooter({ text: `Page ${currentPage}/${totalPages}` });

						interaction.editReply({ embeds: [warningsEmbed] });
						collected.deferUpdate();
						break;
				}
			});

			collector.on('end', () => {
				interaction.editReply({ components: [] });
			});
		}
	},
});
