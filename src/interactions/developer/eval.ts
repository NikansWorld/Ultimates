import { interactionOptions } from '../../typings/Command';

export const evalCommand = {
	name: 'eval',
	description: 'Eval a code directly into the bot!',
	directory: 'developer',
	cooldown: 3000,
	permission: [],
} as interactionOptions;

