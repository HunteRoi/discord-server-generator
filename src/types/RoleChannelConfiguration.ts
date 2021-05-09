import { RoleData } from "discord.js";
import { CreateChannelOptions } from "./CreateChannelOptions";

export interface RoleChannelConfiguration {
  role?: RoleData;
  channel: CreateChannelOptions;
}