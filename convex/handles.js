import { mutation, query } from 'convex/server';
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
