import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const addTemplate = mutation({
  args: {
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { name, content }) => {
    const id = await ctx.db.insert('promptTemplates', {
      name,
      content,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const listTemplates = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query('promptTemplates').collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});
