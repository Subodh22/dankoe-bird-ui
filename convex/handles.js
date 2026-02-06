import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

function normalizeHandle(handle) {
  return handle.trim().replace(/^@/, '').toLowerCase();
}

export const upsertHandles = mutation({
  args: { handles: v.array(v.string()) },
  handler: async (ctx, { handles }) => {
    const normalized = handles.map(normalizeHandle).filter(Boolean);
    const now = Date.now();
    const results = [];

    for (const handle of normalized) {
      const existing = await ctx.db
        .query('handles')
        .withIndex('by_handle', (q) => q.eq('handle', handle))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { active: true });
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert('handles', {
          handle,
          active: true,
          createdAt: now,
        });
        results.push(id);
      }
    }

    return { count: normalized.length };
  },
});

export const listHandles = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query('handles').collect();
    return rows.filter((row) => row.active).map((row) => row.handle);
  },
});

export const listHandlesWithStats = query({
  args: { since: v.optional(v.number()) },
  handler: async (ctx, { since }) => {
    const rows = await ctx.db.query('handles').collect();
    const active = rows.filter((row) => row.active).map((row) => row.handle);
    const start = since ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const results = [];

    for (const handle of active) {
      const tweets = await ctx.db
        .query('tweets')
        .withIndex('by_handle_createdAt', (q) => q.eq('handle', handle).gte('createdAt', start))
        .collect();

      const count = tweets.length;
      const totalEngagement = tweets.reduce((sum, tweet) => sum + (tweet.engagement ?? 0), 0);
      const avgEngagement = count > 0 ? totalEngagement / count : 0;

      results.push({
        handle,
        tweetCount: count,
        avgEngagement,
      });
    }

    results.sort((a, b) => b.tweetCount - a.tweetCount);
    return results;
  },
});
