import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const tweetInput = v.object({
  tweetId: v.string(),
  handle: v.string(),
  createdAt: v.number(),
  text: v.string(),
  authorName: v.string(),
  authorUsername: v.string(),
  replyCount: v.number(),
  retweetCount: v.number(),
  likeCount: v.number(),
  engagement: v.number(),
  url: v.union(v.string(), v.null()),
});

export const storeTweets = mutation({
  args: { tweets: v.array(tweetInput) },
  handler: async (ctx, { tweets }) => {
    let inserted = 0;
    let updated = 0;

    for (const tweet of tweets) {
      const existing = await ctx.db
        .query('tweets')
        .withIndex('by_tweet', (q) => q.eq('tweetId', tweet.tweetId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, tweet);
        updated += 1;
      } else {
        await ctx.db.insert('tweets', tweet);
        inserted += 1;
      }
    }

    return { inserted, updated };
  },
});

export const getTweetsByWindow = query({
  args: {
    handles: v.optional(v.array(v.string())),
    since: v.number(),
  },
  handler: async (ctx, { handles, since }) => {
    if (handles && handles.length > 0) {
      const results = [];
      for (const handle of handles) {
        const rows = await ctx.db
          .query('tweets')
          .withIndex('by_handle_createdAt', (q) => q.eq('handle', handle).gte('createdAt', since))
          .collect();
        results.push(...rows);
      }
      return results;
    }

    return ctx.db
      .query('tweets')
      .withIndex('by_createdAt', (q) => q.gte('createdAt', since))
      .collect();
  },
});

export const getHistory = query({
  args: {
    handles: v.optional(v.array(v.string())),
    since: v.optional(v.number()),
    until: v.optional(v.number()),
    text: v.optional(v.string()),
    minLikes: v.optional(v.number()),
    minRetweets: v.optional(v.number()),
    minReplies: v.optional(v.number()),
    minEngagement: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { handles, since, until, text, minLikes, minRetweets, minReplies, minEngagement },
  ) => {
    const start = since ?? 0;
    const normalizedText = text?.trim().toLowerCase();

    let rows = [];
    if (handles && handles.length > 0) {
      for (const handle of handles) {
        const handleRows = await ctx.db
          .query('tweets')
          .withIndex('by_handle_createdAt', (q) => q.eq('handle', handle).gte('createdAt', start))
          .collect();
        rows.push(...handleRows);
      }
    } else {
      rows = await ctx.db
        .query('tweets')
        .withIndex('by_createdAt', (q) => q.gte('createdAt', start))
        .collect();
    }

    const filtered = rows.filter((tweet) => {
      if (until && tweet.createdAt > until) {
        return false;
      }
      if (normalizedText && !tweet.text.toLowerCase().includes(normalizedText)) {
        return false;
      }
      if (minLikes !== undefined && tweet.likeCount < minLikes) {
        return false;
      }
      if (minRetweets !== undefined && tweet.retweetCount < minRetweets) {
        return false;
      }
      if (minReplies !== undefined && tweet.replyCount < minReplies) {
        return false;
      }
      if (minEngagement !== undefined && tweet.engagement < minEngagement) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt - a.createdAt);
    return filtered;
  },
});
