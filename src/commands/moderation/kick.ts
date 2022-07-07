import { GuildMember } from 'discord.js';
import { getModCase } from '../../functions/cases/modCase';
import { MAX_REASON_LENGTH, punishmentExpiry } from '../../constants';
import { ignore } from '../../functions/ignore';
import { createModLog } from '../../functions/logs/createModLog';
import { punishmentModel } from '../../models/punishments';
import { Command } from '../../structures/Command';
import { PunishmentTypes } from '../../typings';
import { generateManualId } from '../../utils/generatePunishmentId';
import { sendModDM } from '../../utils/sendModDM';
import { interactions } from '../../interactions';
import { splitText } from '../../functions/other/splitText';
import { t } from 'i18next';

export default new Command({
	interaction: interactions.kick,
	excute: async ({ client, interaction, options }) => {
		const member = options.getMember('member') as GuildMember;
		const reason =
			splitText(options.getString('reason'), MAX_REASON_LENGTH) ?? t('common.noReason');

		if (!member)
			return interaction.reply({
				embeds: [client.embeds.error('I could not find that member in this server.')],
				ephemeral: true,
			});

		if (ignore(member, { interaction, action: PunishmentTypes.Kick })) return;

		const data = new punishmentModel({
			_id: await generateManualId(),
			case: await getModCase(),
			type: PunishmentTypes.Kick,
			userId: member.id,
			moderatorId: interaction.user.id,
			reason: reason,
			date: new Date(),
			expire: punishmentExpiry,
		});
		await data.save();

		await sendModDM(member, {
			action: PunishmentTypes.Kick,
			punishment: data,
		});
		await member.kick(reason);

		await interaction.reply({
			embeds: [
				client.embeds.moderation(member.user, {
					action: PunishmentTypes.Kick,
					id: data._id,
				}),
			],
			ephemeral: true,
		});

		await createModLog({
			action: PunishmentTypes.Kick,
			punishmentId: data._id,
			user: member.user,
			moderator: interaction.user,
			reason: reason,
			expire: punishmentExpiry,
		});
	},
});
