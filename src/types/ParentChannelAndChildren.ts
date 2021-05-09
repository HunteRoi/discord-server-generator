import { ChannelType } from './ChannelType';

export interface ParentChannelAndChildren {
  channel: ChannelType;
  children?: ChannelType[];
}
