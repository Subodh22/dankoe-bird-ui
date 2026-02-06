import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const addSelection = mutation({
  args: {
    tweetId: v.string(),
    handle: v.string(),
  },
  handler: async (ctx, { tweetId, handle }) => {
    const existing = await ctx.db
      .query('scriptSelections')
      .withIndex('by_tweet', (q) => q.eq('tweetId', tweetId))
      .unique();
    if (existing) {
      return { added: false };
    }
    await ctx.db.insert('scriptSelections', {
      tweetId,
      handle,
      addedAt: Date.now(),
    });
    return { added: true };
  },
});

export const removeSelection = mutation({
  args: { tweetId: v.string() },
  handler: async (ctx, { tweetId }) => {
    const existing = await ctx.db
      .query('scriptSelections')
      .withIndex('by_tweet', (q) => q.eq('tweetId', tweetId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { removed: true };
    }
    return { removed: false };
  },
});

export const listSelections = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query('scriptSelections').collect();
    rows.sort((a, b) => b.addedAt - a.addedAt);
    return rows;
  },
});

export const clearSelections = mutation({
  handler: async (ctx) => {
    const rows = await ctx.db.query('scriptSelections').collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { cleared: rows.length };
  },
});

export const saveScript = mutation({
  args: {
    model: v.string(),
    prompt: v.string(),
    output: v.string(),
  },
  handler: async (ctx, { model, prompt, output }) => {
    const id = await ctx.db.insert('scripts', {
      model,
      prompt,
      output,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const listScripts = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query('scripts').collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});
