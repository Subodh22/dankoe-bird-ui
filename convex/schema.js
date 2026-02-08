import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  handles: defineTable({
    handle: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index('by_handle', ['handle']),
  tweets: defineTable({
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
    sources: v.optional(v.array(v.string())),
  })
    .index('by_tweet', ['tweetId'])
    .index('by_source_createdAt', ['sources', 'createdAt'])
    .index('by_handle_createdAt', ['handle', 'createdAt'])
    .index('by_createdAt', ['createdAt']),
  scriptSelections: defineTable({
    tweetId: v.string(),
    handle: v.string(),
    addedAt: v.number(),
  }).index('by_tweet', ['tweetId']),
  scripts: defineTable({
    model: v.string(),
    prompt: v.string(),
    output: v.string(),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),
  promptTemplates: defineTable({
    name: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),
});
