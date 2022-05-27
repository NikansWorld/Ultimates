import { ApplicationCommandOptionType } from 'discord.js';

export const banCommand = {
	name: 'ban',
	description: 'Bans a member from the server.',
	directory: 'moderation',
	cooldown: 3000,
	permission: ['BanMembers'],
	options: [
		{
			name: 'user',
			description: 'The user you wish to ban.',
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: 'delete_messages',
			description: 'The amount of days to delete messages for.',
			type: ApplicationCommandOptionType.Number,
			required: false,
			choices: [
				{ name: "Don't delete any", value: 0 },
				{ name: 'Previous 24 hours', value: 1 },
				{ name: 'Previous 48 hours', value: 2 },
				{ name: 'Previous 3 days', value: 3 },
				{ name: 'Previous 4 days', value: 4 },
				{ name: 'Previous 5 days', value: 5 },
				{ name: 'Previous 6 days', value: 6 },
				{ name: 'Previous 7 days', value: 7 },
			],
		},
		{
			name: 'reason',
			description: 'The reason of the ban.',
			type: ApplicationCommandOptionType.String,
			required: false,
			autocomplete: true,
		},
	],
} as const;
