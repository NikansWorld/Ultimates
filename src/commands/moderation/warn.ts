import { GuildMember } from 'discord.js';
import { getModCase } from '../../functions/cases/modCase';
import { punishmentExpiry, warningExpiry } from '../../constants';
import { ignore } from '../../functions/ignore';
import { createModLog } from '../../functions/logs/createModLog';
import { punishmentModel } from '../../models/punishments';
import { Command } from '../../structures/Command';
import { PunishmentType } from '../../typings/PunishmentType';
import { generateManualId } from '../../utils/generatePunishmentId';
import { timeoutMember } from '../../utils/timeoutMember';
import { sendModDM } from '../../utils/sendModDM';
import { default_config, auto_mute } from '../../json/moderation.json';
import { interactions } from '../../interactions';
import { convertTime } from '../../functions/convertTime';
enum reasons {
	'two' = 'Reaching 2 manual warnings.',
	'four' = 'Reaching 4 manual warnings.',
	'six' = 'Reaching 6 manual warnings.',
}
enum durations {
	'two' = +convertTime(auto_mute[2]),
	'four' = +convertTime(auto_mute[4]),
}

export default new Command({
	interaction: interactions.warn,
	excute: async ({ client, interaction, options }) => {
		const member = options.getMember('member') as GuildMember;
		const reason = options.getString('reason') || default_config.reason;

		if (ignore(member, { interaction, action: PunishmentType.Warn })) return;

		const warnData = new punishmentModel({
			_id: generateManualId(),
			case: await getModCase(),
			type: PunishmentType.Warn,
			userId: member.id,
			moderatorId: interaction.user.id,
			reason: reason,
			date: new Date(),
			expire: warningExpiry,
		});
		await warnData.save();

		interaction.reply({
			embeds: [
				client.embeds.moderation(member.user, {
					action: PunishmentType.Warn,
					id: warnData._id,
				}),
			],
			ephemeral: true,
		});

		sendModDM(member, {
			action: PunishmentType.Warn,
			expire: warnData.expire,
			punishment: warnData,
		});

		await createModLog({
			action: PunishmentType.Warn,
			punishmentId: warnData._id,
			user: member.user,
			moderator: interaction.user,
			reason: reason,
			expire: warningExpiry,
		}).then(async () => {
			// ------------------------------------- checking for auto action on warn counts --------------------------------

			const findWarnings = await punishmentModel.find({
				userId: member.id,
				type: PunishmentType.Warn,
			});
			const warningsCount = findWarnings.length;

			switch (warningsCount) {
				case 2:
					await timeoutMember(member, {
						duration: durations['two'],
						reason: reasons['two'],
					});

					const data = new punishmentModel({
						_id: generateManualId(),
						case: await getModCase(),
						type: PunishmentType.Timeout,
						userId: member.id,
						moderatorId: client.user.id,
						reason: reasons['two'],
						date: new Date(),
						expire: new Date(warningExpiry.getTime() + durations.two),
					});
					data.save();

					await createModLog({
						action: PunishmentType.Timeout,
						punishmentId: data._id,
						user: member.user,
						moderator: client.user,
						reason: reasons['two'],
						duration: durations['two'],
						referencedPunishment: warnData,
					});

					sendModDM(member, {
						action: PunishmentType.Timeout,
						punishment: data,
						expire: new Date(Date.now() + durations.two),
					});
					break;
				case 4:
					await timeoutMember(member, {
						duration: durations['four'],
						reason: reasons['four'],
					});

					const data2 = new punishmentModel({
						_id: generateManualId(),
						case: await getModCase(),
						type: PunishmentType.Timeout,
						userId: member.id,
						moderatorId: client.user.id,
						reason: reasons['four'],
						date: new Date(),
						expire: new Date(warningExpiry.getTime() + durations.two),
					});
					data2.save();

					await createModLog({
						action: PunishmentType.Timeout,
						punishmentId: data2._id,
						user: member.user,
						moderator: client.user,
						reason: reasons['four'],
						duration: durations['four'],
						referencedPunishment: warnData,
					});

					sendModDM(member, {
						action: PunishmentType.Timeout,
						punishment: data2,
						expire: new Date(Date.now() + durations.four),
					});
					break;
				case 6:
					const data3 = new punishmentModel({
						_id: generateManualId(),
						case: await getModCase(),
						type: PunishmentType.Ban,
						userId: member.id,
						moderatorId: client.user.id,
						reason: reasons['six'],
						date: new Date(),
						expire: punishmentExpiry,
					});
					data3.save();

					await createModLog({
						action: PunishmentType.Ban,
						punishmentId: data3._id,
						user: member.user,
						moderator: client.user,
						reason: reasons['six'],
						referencedPunishment: warnData,
						expire: punishmentExpiry,
					});

					await sendModDM(member, {
						action: PunishmentType.Ban,
						punishment: data3,
					});
					await member.ban({
						reason: reasons['six'],
						deleteMessageDays: default_config.ban_delete_messages,
					});
					break;
			}
		});
	},
});
