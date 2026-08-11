export type TelegramChannel = {
  name: string;
  chatId: number;
  inviteLink: string;
  inviteLinkLabel: string;
  channelUrl: string;
};

// Add future channels here. All membership checks and buttons are generated from this list.
export const CHANNELS: TelegramChannel[] = [
  {
    name: "Main Channel",
    chatId: -1001898840240,
    inviteLink: "https://t.me/+vqLE7JWny5hlYmE0",
    inviteLinkLabel: "Main Channel - Doorman invite",
    channelUrl: "https://t.me/+vqLE7JWny5hlYmE0",
  },
  {
    name: "Verified Circle",
    chatId: -1003533852466,
    inviteLink: "https://t.me/+7Za07a2ON3EzZWQ0",
    inviteLinkLabel: "Verified Circle invite",
    channelUrl: "https://t.me/+7Za07a2ON3EzZWQ0",
  },
  {
    name: "Anal",
    chatId: -1003619698591,
    inviteLink: "https://t.me/+n4h9D-tgxzMwNTU0",
    inviteLinkLabel: "Anal invite",
    channelUrl: "https://t.me/+n4h9D-tgxzMwNTU0",
  },
  {
    name: "Pegging",
    chatId: -1002161906620,
    inviteLink: "https://t.me/+wmECtm-WcUA3NjIx",
    inviteLinkLabel: "Pegging invite",
    channelUrl: "https://t.me/+wmECtm-WcUA3NjIx",
  },
  {
    name: "Cleo's Golden Drops",
    chatId: -1004288272338,
    inviteLink: "https://t.me/+KxNZ3y3ifSZjODRk",
    inviteLinkLabel: "Golden Drops invite",
    channelUrl: "https://t.me/+KxNZ3y3ifSZjODRk",
  },
  {
    name: "Lobby",
    chatId: -1001834111990,
    inviteLink: "https://t.me/+iVzOBeu81ugzODM8",
    inviteLinkLabel: "Lobby invite",
    channelUrl: "https://t.me/+iVzOBeu81ugzODM8",
  },
];

export function findChannel(chatId: number | string): TelegramChannel | undefined {
  return CHANNELS.find((channel) => String(channel.chatId) === String(chatId));
}