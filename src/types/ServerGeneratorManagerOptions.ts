import { CreateChannelOptions } from './CreateChannelOptions';

export interface ServerGeneratorManagerOptions {
	oneTimeChannelsConfiguration: CreateChannelOptions[];
	manyTimesChannelConfiguration: CreateChannelOptions;
}
