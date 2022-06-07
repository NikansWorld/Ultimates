import { Snowflake } from 'discord.js';
import mongoose from 'mongoose';

type T = {
	_id: 'moderation' | 'automod' | 'logging' | 'general' | 'ignore';
	// General
	ownerId: string;
	developers: string[];
	success: string;
	error: string;
	attention: string;
	guild: {
		id: string;
		appealLink: string;
		memberRoleId: string | Snowflake;
		modmailCategoryId: string | Snowflake;
	};
	// Automod
	filteredWords: string[];
	modules: {
		badwords: boolean;
		invites: boolean;
		largeMessage: boolean;
		massMention: boolean;
		massEmoji: boolean;
		spam: boolean;
		capitals: boolean;
		urls: boolean;
	};
	// Logging
	logging: {
		mod: { channelId: string; webhook: string; active: boolean };
		modmail: { channelId: string; webhook: string; active: boolean };
		message: { channelId: string; webhook: string; active: boolean };
		servergate: { channelId: string; webhook: string; active: boolean };
		error: { channelId: string; webhook: string; active: boolean };
	};
};

const schema = new mongoose.Schema({
	_id: String,
	// General
	ownerId: { type: String, required: false },
	developers: { type: Object, required: false },
	success: { type: String, required: false },
	error: { type: String, required: false },
	attention: { type: String, required: false },
	guild: { type: Object, required: false },
	// Automod
	filteredWords: { type: Array, required: false },
	modules: { type: Object, required: false },
	// Logging
	logging: { type: Object },
});

export const configModel = mongoose.model<T>('config', schema);

