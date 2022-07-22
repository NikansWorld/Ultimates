import { EmbedBuilder, Message, TextChannel, User } from 'discord.js';
import { durationsModel } from '../../models/durations';
import { punishmentModel } from '../../models/punishments';
import { Command } from '../../structures/Command';
import { automodModel } from '../../models/automod';
import { logsModel } from '../../models/logs';
import { interactions } from '../../interactions';
import { PunishmentTypes } from '../../typings';
import { createModLog } from '../../functions/logs/createModLog';
import { generateDiscordTimestamp } from '../../utils/generateDiscordTimestamp';
import { AUTOMOD_ID_LENGTH, MAX_REASON_LENGTH, PUNISHMENT_ID_LENGTH } from '../../constants';
import { getUrlFromCase } from '../../functions/cases/getURL';
import { capitalize } from '../../functions/other/capitalize';
import { splitText } from '../../functions/other/splitText';
import { t } from 'i18next';
import { Paginator } from '../../structures/Paginator';

export default new Command({
	interaction: interactions.punishment,
	excute: async ({ client, interaction, options }) => {
		const getSubCommand = options.getSubcommand();

		if (getSubCommand === 'revoke') {
			const warnId = options.getString('id');
			const reason = splitText(options.getString('reason'), MAX_REASON_LENGTH) ?? t('common.noReason');

			const data =
				warnId.length == AUTOMOD_ID_LENGTH
					? await automodModel.findById(warnId).catch(() => {})
					: await punishmentModel.findById(warnId).catch(() => {});
			if (!data)
				return interaction.reply({
					embeds: [client.embeds.error(t('common.$errors.invalidID'))],
					ephemeral: true,
				});

			await interaction.deferReply({ ephemeral: true });
			const getMember = interaction.guild.members.cache.get(data.userId);
			const fetchUser = await client.users.fetch(data.userId);
			switch (data.type) {
				case PunishmentTypes.Timeout:
					if (
						await durationsModel.findOne({
							type: PunishmentTypes.Timeout,
							userId: data.userId,
						})
					) {
						if (!getMember)
							return interaction.followUp({
								embeds: [
									client.embeds.error(
										'The punished user is not in the server. I can not revoke the timeout.'
									),
								],
							});

						await getMember.timeout(null, 'Mute ended based on the duration.');

						await interaction.followUp({
							embeds: [client.embeds.success(`Punishment **${warnId}** was revoked.`)],
						});

						await createModLog({
							action: PunishmentTypes.Unmute,
							user: fetchUser,
							moderator: interaction.user,
							reason: reason,
							referencedPunishment: data,
						}).then(async () => {
							await durationsModel.findOneAndDelete({
								type: PunishmentTypes.Timeout,
								case: data.case,
							});
							await logsModel.findByIdAndDelete(data.case);
							data.delete();
						});
					} else {
						await interaction.followUp({
							embeds: [client.embeds.success(`Punishment **${warnId}** was revoked.`)],
						});

						await createModLog({
							action: data.type as PunishmentTypes,
							user: fetchUser,
							moderator: interaction.user,
							reason: reason,
							referencedPunishment: data,
							revoke: true,
						}).then(async () => {
							await logsModel.findByIdAndDelete(data.case);
							data.delete();
						});
					}
					break;
				case PunishmentTypes.Ban:
				case PunishmentTypes.Softban:
					if (await interaction.guild.bans.fetch(data.userId).catch(() => {})) {
						interaction.guild.members.unban(fetchUser, reason);

						if (data.type === PunishmentTypes.Softban)
							await durationsModel.findOneAndDelete({
								type: PunishmentTypes.Softban,
								case: data.case,
							});

						await interaction.followUp({
							embeds: [client.embeds.success(`Punishment **${warnId}** was revoked.`)],
						});

						await createModLog({
							action: PunishmentTypes.Unban,
							user: fetchUser,
							moderator: interaction.user,
							reason: reason,
							referencedPunishment: data,
						}).then(async () => {
							if (!(await logsModel.findByIdAndDelete(data.case)).antiraid)
								await logsModel.findByIdAndDelete(data.case);

							data.delete();
						});
					} else {
						await interaction.followUp({
							embeds: [client.embeds.success(`Punishment **${warnId}** was **revoked**.`)],
						});

						await createModLog({
							action: data.type as PunishmentTypes,
							user: fetchUser,
							moderator: interaction.user,
							reason: reason,
							referencedPunishment: data,
							revoke: true,
						}).then(async () => {
							if (!(await logsModel.findByIdAndDelete(data.case)).antiraid)
								await logsModel.findByIdAndDelete(data.case);

							data.delete();
						});
					}
					break;
				default:
					await interaction.followUp({
						embeds: [client.embeds.success(`Punishment **${warnId}** was revoked.`)],
					});

					await createModLog({
						action: data.type as PunishmentTypes,
						user: fetchUser,
						moderator: interaction.user,
						reason: reason,
						referencedPunishment: data,
						revoke: true,
					}).then(async () => {
						await logsModel.findByIdAndDelete(data.case);
						data.delete();
					});
					break;
			}
		} else if (getSubCommand === 'search') {
			let doesExist: boolean = true;
			const warnId = options.getString('id');
			const baseEmbed = new EmbedBuilder().setColor(client.cc.invisible);

			switch (warnId.length) {
				case AUTOMOD_ID_LENGTH:
					const automodWarn = await automodModel.findById(warnId).catch(() => {
						doesExist = false;
					});
					if (!automodWarn) return (doesExist = false);

					const automodUser = (await client.users.fetch(automodWarn.userId).catch(() => {})) as User;

					baseEmbed
						.setDescription(`ID: \`${warnId}\` • Case: ${automodWarn.case}`)
						.setAuthor({
							name: client.user.username,
							iconURL: client.user.displayAvatarURL(),
						})
						.addFields([
							{
								name: 'Type',
								value: `Automod ${capitalize(automodWarn.type)}`,
								inline: true,
							},
							{
								name: 'Date & Time',
								value: generateDiscordTimestamp(automodWarn.date, 'Short Date/Time'),
								inline: true,
							},
							{
								name: 'Expire',
								value: generateDiscordTimestamp(automodWarn.expire),
								inline: true,
							},
							{
								name: 'User',
								value: automodUser.toString(),
								inline: true,
							},
							{
								name: 'User Tag',
								value: automodUser.tag,
								inline: true,
							},
							{
								name: 'User Id',
								value: automodWarn.userId,
								inline: true,
							},
							{
								name: 'Reason',
								value: automodWarn.reason,
								inline: true,
							},
						]);
					break;
				case PUNISHMENT_ID_LENGTH:
					const manualWarn = await punishmentModel.findById(warnId).catch(() => {
						doesExist = false;
					});
					if (!manualWarn) return (doesExist = false);

					const manualUser = (await client.users.fetch(manualWarn.userId).catch(() => {})) as User;
					const getMod = (await client.users.fetch(manualWarn.moderatorId).catch(() => {})) as User;

					baseEmbed
						.setDescription(`ID: \`${warnId}\` • Case: ${manualWarn.case}`)
						.setAuthor({
							name: client.user.username,
							iconURL: client.user.displayAvatarURL(),
						})
						.addFields([
							{
								name: 'Type',
								value: `Manual ${capitalize(manualWarn.type)}`,
								inline: true,
							},
							{
								name: 'Date & Time',
								value: generateDiscordTimestamp(manualWarn.date, 'Short Date/Time'),
								inline: true,
							},
							{
								name: 'Expire',
								value: generateDiscordTimestamp(manualWarn.expire),
								inline: true,
							},
							{
								name: 'User',
								value: manualUser.toString(),
								inline: true,
							},
							{
								name: 'User Tag',
								value: manualUser.tag,
								inline: true,
							},
							{
								name: 'User Id',
								value: manualWarn.userId,
								inline: true,
							},
							{
								name: 'Moderator',
								value: getMod.toString(),
								inline: true,
							},
							{
								name: 'Moderator Tag',
								value: getMod.tag,
								inline: true,
							},
							{
								name: 'Moderator Id',
								value: manualWarn.moderatorId,
								inline: true,
							},
							{
								name: 'Reason',
								value: manualWarn.reason,
								inline: true,
							},
						]);
					break;
				default:
					doesExist = false;
					break;
			}

			if (!doesExist)
				return interaction.reply({
					embeds: [client.embeds.error(t('common.$errors.invalidID'))],
					ephemeral: true,
				});

			interaction.reply({ embeds: [baseEmbed] });
		} else if (getSubCommand === 'view') {
			// Catching the proper user
			const user = options.getUser('user');

			// Getting all the warnings
			const findWarningsNormal = await punishmentModel.find({ userId: user.id });
			const findWarningsAutomod = await automodModel.find({ userId: user.id });
			let warnCounter = 0;

			const warnings = findWarningsNormal
				.map((data) => {
					warnCounter = warnCounter + 1;
					return [
						`\`${warnCounter}\` **${capitalize(data.type)}** | **ID: ${data._id}**`,
						`• **Date:** ${generateDiscordTimestamp(data.date, 'Short Date/Time')}`,
						data.moderatorId === client.user.id
							? `• **Moderator:** Automatic`
							: client.users.cache.get(data.moderatorId) === undefined
							? `• **Moderator ID:** ${data.moderatorId}`
							: `• **Moderator:** ${client.users.cache.get(data.moderatorId).tag}`,
						data.type === 'WARN'
							? `• **Expire:** ${generateDiscordTimestamp(data.expire)}`
							: 'LINE_BREAK',
						`• **Reason:** ${data.reason}`,
					]
						.join('\n')
						.replaceAll('\nLINE_BREAK', '');
				})
				.concat(
					findWarningsAutomod.map((data) => {
						warnCounter = warnCounter + 1;
						return [
							`\`${warnCounter}\` **${capitalize(data.type)}** | Auto Moderation`,
							`• **Date:** ${generateDiscordTimestamp(data.date, 'Short Date/Time')}`,
							data.type === 'WARN'
								? `• **Expire:** ${generateDiscordTimestamp(data.expire)}`
								: 'LINE_BREAK',
							`• **Reason:** ${data.reason}`,
						]
							.join('\n')
							.replaceAll('\nLINE_BREAK', '');
					})
				);

			const embed = new EmbedBuilder()
				.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
				.setColor(client.cc.invisible)
				.setThumbnail(user.displayAvatarURL());

			// Sending the results
			if (warnings.length === 0)
				return interaction.reply({
					embeds: [
						new EmbedBuilder({
							description: `No punishments were found for **${user.tag}**`,
							color: client.cc.invisible,
						}),
					],
					ephemeral: true,
				});

			await interaction.deferReply();
			if (warnings.length <= 3) {
				embed.setDescription(warnings.map((data) => data.toString()).join('\n\n'));
				interaction.followUp({ embeds: [embed] });
			} else if (warnings.length > 3) {
				embed.setDescription('${{array}}').setFooter({
					text: 'Page ${{currentPage}}/${{totalPages}}',
				});

				const paginator = new Paginator();
				paginator.start(interaction, {
					array: warnings.map((data) => data.toString()),
					itemPerPage: 3,
					joinWith: '\n\n',
					time: 60 * 1000,
					embed: embed,
				});
			}
		} else if (getSubCommand === 'reason') {
			const id = options.getString('id');
			let reason = options.getString('reason');
			let punishment: any = null;

			await interaction.deferReply({ ephemeral: true });
			switch (id.length) {
				case PUNISHMENT_ID_LENGTH:
					punishment = await punishmentModel.findById(id).catch(() => {});
					break;
				case AUTOMOD_ID_LENGTH:
					punishment = await automodModel.findById(id).catch(() => {});
					break;
			}

			if (!punishment || punishment === undefined)
				return interaction.followUp({
					embeds: [client.embeds.error(t('common.$errors.invalidID'))],
					ephemeral: true,
				});

			if (punishment.reason === reason)
				return interaction.reply({
					embeds: [client.embeds.attention('Please provide a different reason than the current one.')],
				});

			switch (id.length) {
				case PUNISHMENT_ID_LENGTH:
					punishment = await punishmentModel.findByIdAndUpdate(id, {
						$set: { reason: reason },
					});
					break;
				case AUTOMOD_ID_LENGTH:
					punishment = await automodModel.findByIdAndUpdate(id, {
						$set: { reason: reason },
					});
					break;
			}

			await interaction.followUp({
				embeds: [client.embeds.success(`Reason was updated to **${reason}**`)],
			});

			const updateLog = await createModLog({
				action: punishment.type as PunishmentTypes,
				user: await client.users.fetch(punishment.userId),
				moderator: interaction.user,
				reason: reason,
				referencedPunishment: punishment,
				update: true,
			});

			if ((await logsModel.findById(punishment.case)).antiraid) return;
			const substanceLogID = (await getUrlFromCase(punishment.case)).split('/')[6];
			const substanceLogChannel = (await client.channels
				.fetch((await getUrlFromCase(punishment.case)).split('/')[5])
				.catch(() => {})) as TextChannel;
			if (!substanceLogChannel) return;
			const substanceLog = (await substanceLogChannel.messages
				.fetch(substanceLogID)
				.catch(() => {})) as Message;
			if (!substanceLog) return;

			client.config.webhooks.mod.editMessage(substanceLogID, {
				embeds: [
					EmbedBuilder.from(substanceLog.embeds[0]).setDescription(
						substanceLog.embeds[0].description.replaceAll(
							'\n• **Reason',
							`\n• **Reason [[U](${updateLog})]`
						)
					),
				],
			});
		}
	},
});
