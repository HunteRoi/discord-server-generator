import {
	CategoryChannel,
	NewsChannel,
	StageChannel,
	StoreChannel,
	TextChannel,
	VoiceChannel,
} from 'discord.js';

import { CategoryOptions, GuildChannelOptions } from '../types';

export const handleChannelCreate = async (
	channel:
		| TextChannel
		| VoiceChannel
		| CategoryChannel
		| NewsChannel
		| StoreChannel
		| StageChannel,
	options: CategoryOptions | GuildChannelOptions
) => {
	if (options.isRulesChannel && channel.isText()) {
		await channel.guild.setRulesChannel(channel.id);
	}

	if (options.isAFKChannel && channel.isVoice()) {
		await channel.guild.setAFKChannel(channel.id);
	}
};
