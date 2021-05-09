import { RoleChannelConfiguration } from "./RoleChannelConfiguration";
import { YearConfiguration } from "./YearConfiguration";

export interface ServerConfiguration {
  forceCleanServer: boolean;
  prefix: string;
  years: YearConfiguration[];
  others: RoleChannelConfiguration[];
}