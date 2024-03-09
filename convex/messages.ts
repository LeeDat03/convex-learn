import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

interface Message {
  author: string;
  body: string;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const messages = await ctx.db.query("messages").order("desc").take(100);

    const messageLikes = await Promise.all(
      messages.map(async (m) => {
        const likes = await ctx.db
          .query("likes")
          .withIndex("byMessageId", (q) => q.eq("messageId", m._id))
          .collect();

        return {
          ...m,
          likes: likes.length,
        };
      })
    );

    // Reverse the list so that it's in a chronological order.
    return messageLikes.reverse().map((mess: Message) => {
      return {
        ...mess,
        body: mess.body.replace(":)", "🙂"),
      };
    });
  },
});

export const send = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, { body, author }) => {
    // Send a new message.
    await ctx.db.insert("messages", { body, author });
  },
});

export const like = mutation({
  args: { liker: v.string(), messageId: v.id("messages") },
  handler: async (ctx, { liker, messageId }) => {
    await ctx.db.insert("likes", { liker, messageId });
  },
});
