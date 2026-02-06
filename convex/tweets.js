import { mutation, query } from 'convex/server';
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
