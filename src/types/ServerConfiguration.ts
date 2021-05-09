import { RoleData } from 'discord.js';

import { RoleChannelConfiguration } from './RoleChannelConfiguration';
import { YearConfiguration } from './YearConfiguration';

export interface ServerConfiguration {
  forceCleanServer?: boolean;
  prefix: string;
  roles?: RoleData[];
  manyTimesGeneration?: YearConfiguration[];
  oneTimeGeneration?: RoleChannelConfiguration[];
}
