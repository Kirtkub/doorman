import type { NextApiRequest, NextApiResponse } from "next";
import { findChannel, CHANNELS, type TelegramChannel } from "../../lib/channels";
import { escapeHtml, telegramApi } from "../../lib/telegram";

type MembershipResult = {
  channel: TelegramChannel;
  subscribed: boolean;
};

function isCurrentMember(status: string, isMember?: boolean): boolean {
  return status === "creator" || status === "administrator" || status === "member" ||
    (status === "restricted" && isMember === true);
}

async function checkMembership(userId: number, channel: TelegramChannel): Promise<MembershipResult> {
  try {
    const member = await telegramApi<{ status: string; is_member?: boolean }>("getChatMember", {
      chat_id: channel.chatId,
      user_id: userId,
    });
    return { channel, subscribed: isCurrentMember(member.status, member.is_member) };
  } catch (error) {
    console.error(`Could not check membership for "${channel.name}"`, error);
    return { channel, subscribed: false };
  }
}

async function handleJoinRequest(joinRequest: {
  chat?: { id: number };
  from?: { id: number };
}) {
  const channel = joinRequest.chat && findChannel(joinRequest.chat.id);
  const userId = joinRequest.from?.id;

  if (!channel || !userId) {
    console.info("Ignoring an unconfigured or malformed chat join request");
    return;
  }

  await telegramApi("approveChatJoinRequest", {
    chat_id: channel.chatId,
    user_id: userId,
  });

  const channelName = escapeHtml(channel.name);
  const channelUrl = escapeHtml(channel.channelUrl);
  try {
    await telegramApi("sendMessage", {
      chat_id: userId,
      text:
        `<b>Congratulations! 🎉</b>\n\n` +
        `You have been accepted into the channel\n` +
        `<a href="${channelUrl}"><b>${channelName}</b></a>\n\n` +
        `Come on in, you can join now! And don't forget to <b>add your reaction</b> to your favorite posts ❤️`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "OPEN CHANNEL", url: channel.channelUrl }]],
      },
    });
  } catch (error) {
    console.error(`Join request approved, but private message failed for user ${userId}`, error);
  }
}

async function handleUserMessage(message: {
  from?: { id: number };
}) {
  const userId = message.from?.id;
  if (!userId) {
    console.info("Ignoring a message without a Telegram user");
    return;
  }

  const memberships = await Promise.all(CHANNELS.map((channel) => checkMembership(userId, channel)));
  const subscribedCount = memberships.filter(({ subscribed }) => subscribed).length;
  const totalChannels = CHANNELS.length;
  const missingCount = totalChannels - subscribedCount;

  let text: string;
  if (subscribedCount === totalChannels) {
    text = "🎉🎉 You are subscribed to all official Cleo & Leo Telegram channels! ❤️ Great job! 🎉";
  } else if (subscribedCount === 0) {
    text = "Subscribe to the official Cleo & Leo Telegram channels!";
  } else {
    text =
      `You are subscribed to ${subscribedCount} out of ${totalChannels} Cleo & Leo Telegram channels.\n\n` +
      `Subscribe now to the other ${missingCount} ${missingCount === 1 ? "channel" : "channels"} you're missing!`;
  }

  await telegramApi("sendMessage", {
    chat_id: userId,
    text,
    reply_markup: {
      inline_keyboard: memberships.map(({ channel, subscribed }) => [{
        text: `${subscribed ? "✅" : "⚠️➡️"} ${channel.name}`,
        url: channel.channelUrl,
      }]),
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body && typeof req.body === "object" ? req.body : {};

    if (update.chat_join_request) {
      await handleJoinRequest(update.chat_join_request);
    } else if (update.message) {
      await handleUserMessage(update.message);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook update failed:", error);
    // Telegram only needs an acknowledgement; one bad update must not stop the webhook.
    return res.status(200).json({ ok: true });
  }
}
