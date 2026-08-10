export type TelegramChannel = {
  name: string;
  chatId: number;
  inviteLink: string;
  channelUrl: string;
};

// Add future channels here. All membership checks and buttons are generated from this list.
export const CHANNELS: TelegramChannel[] = [
  {
    name: "Cleo's Golden Drops",
    chatId: -1004288272338,
    inviteLink: "https://t.me/+KxNZ3y3ifSZjODRk",
    channelUrl: "https://t.me/+KxNZ3y3ifSZjODRk",
  },
  {
    name: "Second Channel",
    chatId: -1003890497500,
    inviteLink: "https://t.me/+FsF-05H0-Ck2ZTg0",
    channelUrl: "https://t.me/+FsF-05H0-Ck2ZTg0",
  },
];

export function findChannel(chatId: number | string): TelegramChannel | undefined {
  return CHANNELS.find((channel) => String(channel.chatId) === String(chatId));
}