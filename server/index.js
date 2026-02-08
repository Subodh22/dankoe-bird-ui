import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { TwitterClient, resolveCredentials } from '@steipete/bird';
import { ConvexHttpClient } from 'convex/browser';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  throw new Error('CONVEX_URL is required');
}
const convex = new ConvexHttpClient(convexUrl);

let clientPromise = null;

function getCookieSource() {
  const env = process.env.BIRD_COOKIE_SOURCE;
  if (!env) {
    return ['chrome', 'firefox'];
  }

  const sources = env
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return sources.length > 0 ? sources : ['chrome', 'firefox'];
}

async function initClient() {
  const cookieSource = getCookieSource();
  const { cookies } = await resolveCredentials({ cookieSource });
  return new TwitterClient({ cookies });
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = initClient();
  }

  try {
    return await clientPromise;
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

function parseCount(value, defaultCount = 20) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultCount;
  }
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}

function normalizeHandle(handle) {
  return handle.trim().replace(/^@/, '');
}

function toTimestamp(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? null : time;
}

function median(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function clampNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOptionalNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function scoreTweetForDanKoe(tweet) {
  const text = (tweet.text ?? '').toLowerCase();
  const length = text.length;
  const engagement = tweet.engagement ?? engagementScore(tweet);

  const positives = [
    'most people',
    'counterintuitive',
    'lesson',
    'mistake',
    'framework',
    'principle',
    'rule',
    'system',
    'leverage',
    'skill',
    'create',
    'build',
    'audience',
    'distribution',
    'offer',
    'pricing',
    'brand',
    'writing',
    'because',
    'therefore',
    'so that',
    'here is',
    'here’s',
    'step',
    'steps',
    'why',
    'how',
  ];

  const negatives = [
    'giveaway',
    'airdrop',
    'free money',
    'dm me',
    'join my',
    'link in bio',
    'crypto pump',
    'nft',
    'motivation',
    'hustle',
    'grind',
    'quote',
  ];

  let contentScore = 0;
  for (const word of positives) {
    if (text.includes(word)) {
      contentScore += 1;
    }
  }
  for (const word of negatives) {
    if (text.includes(word)) {
      contentScore -= 1.5;
    }
  }

  if (length >= 120 && length <= 500) {
    contentScore += 2;
  } else if (length < 60) {
    contentScore -= 1;
  }

  if (/\d+/.test(text)) {
    contentScore += 0.5;
  }

  const normalizedContent = Math.max(0, Math.min(1, contentScore / 6));

  return {
    engagement,
    contentScore: normalizedContent,
  };
}

function buildSelectionReasoning(tweet, scores) {
  const reasons = [];
  if (scores.engagementScore > 0.6) {
    reasons.push('Strong engagement relative to feed');
  }
  if (scores.contentScore > 0.5) {
    reasons.push('Clear insight with actionable framing');
  }
  if (/\d+/.test((tweet.text ?? '').toLowerCase())) {
    reasons.push('Specific details make it teachable');
  }
  if (reasons.length === 0) {
    reasons.push('Balanced signal across engagement and clarity');
  }
  return reasons.join(' • ');
}

function inferVideoScope(tweet, scores) {
  const text = (tweet.text ?? '').toLowerCase();
  if (text.includes('?') || text.includes('hot take') || text.includes('thoughts')) {
    return 'Reaction video: respond to the claim and add your perspective';
  }
  if (scores.contentScore > 0.55) {
    return 'Explanation video: break down the idea and show how to apply it';
  }
  return 'Reaction video: summarize and share a quick opinion';
}

async function callOpenRouter({ model, messages }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function summarizeTweets({ model, tweets }) {
  const content = tweets
    .map((tweet) => `@${tweet.authorUsername}: ${tweet.text}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content:
        'Summarize the tweets into bullet points, key themes, and notable quotes. Return JSON with fields: summary, keyPoints, hashtags, mentions.',
    },
    { role: 'user', content },
  ];

  const output = await callOpenRouter({ model, messages });
  return output;
}

async function getTweetsByIds(tweetIds) {
  if (!tweetIds.length) {
    return [];
  }
  return convex.query('tweets:getTweetsByIds', { tweetIds });
}

function engagementScore(tweet) {
  return (tweet.likeCount ?? 0) + (tweet.retweetCount ?? 0) + (tweet.replyCount ?? 0);
}

function mapTweet(tweet) {
  const username = tweet.author?.username ?? tweet.authorUsername ?? '';
  const id = tweet.id ?? tweet.tweetId;
  return {
    id,
    text: tweet.text ?? '',
    authorName: tweet.author?.name ?? tweet.authorName ?? '',
    authorUsername: username,
    createdAt: tweet.createdAt ?? null,
    replyCount: tweet.replyCount ?? 0,
    retweetCount: tweet.retweetCount ?? 0,
    likeCount: tweet.likeCount ?? 0,
    url: username && id ? `https://x.com/${username}/status/${id}` : null,
    media: Array.isArray(tweet.media)
      ? tweet.media.map((media) => ({
          type: media.type,
          url: media.url,
          previewUrl: media.previewUrl,
          videoUrl: media.videoUrl,
          width: media.width,
          height: media.height,
          durationMs: media.durationMs,
        }))
      : [],
  };
}

function mapOutlierTweet(tweet, baselineMedian) {
  const engagement = engagementScore(tweet);
  const score = baselineMedian > 0 ? engagement / baselineMedian : engagement;
  return {
    ...mapTweet(tweet),
    engagement,
    baselineMedian,
    outlierScore: score,
  };
}

function mapMatrixTweet(tweet) {
  const engagement = engagementScore(tweet);
  return {
    ...mapTweet(tweet),
    engagement,
  };
}

async function mapWithConcurrency(items, limit, handler) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map((item) => handler(item)));
    results.push(...batchResults);
  }
  return results;
}

async function fetchRecentTweetsForHandle(client, handle, perUserLimit, cutoff) {
  const lookup = await client.getUserIdByUsername(handle);
  if (!lookup.success || !lookup.userId) {
    return { handle, tweets: [] };
  }

  const timeline = await client.getUserTweets(lookup.userId, perUserLimit);
  if (!timeline.success || !timeline.tweets) {
    return { handle, tweets: [] };
  }

  const recentTweets = timeline.tweets.filter((tweet) => {
    const time = toTimestamp(tweet.createdAt);
    return time !== null && time >= cutoff;
  });

  return { handle, tweets: recentTweets };
}

function resolveWindow(windowKey) {
  switch (windowKey) {
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '24h':
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function mapTweetForStorage(tweet) {
  const createdAt = toTimestamp(tweet.createdAt);
  return {
    tweetId: tweet.id,
    handle: normalizeHandle(tweet.author?.username ?? ''),
    createdAt: createdAt ?? Date.now(),
    text: tweet.text ?? '',
    authorName: tweet.author?.name ?? '',
    authorUsername: tweet.author?.username ?? '',
    replyCount: tweet.replyCount ?? 0,
    retweetCount: tweet.retweetCount ?? 0,
    likeCount: tweet.likeCount ?? 0,
    engagement: engagementScore(tweet),
    url: tweet.author?.username && tweet.id ? `https://x.com/${tweet.author.username}/status/${tweet.id}` : null,
  };
}

async function getHandlesFromConvex() {
  const handles = await convex.query('handles:listHandles');
  return handles.map((handle) => normalizeHandle(handle)).filter(Boolean);
}

async function fetchAndStoreTweets(handles) {
  const client = await getClient();
  const perUserLimit = 50;
  const now = Date.now();
  const cutoff = now - resolveWindow('30d');
  const concurrency = 3;

  return mapWithConcurrency(handles, concurrency, async (handle) => {
    const { tweets } = await fetchRecentTweetsForHandle(client, handle, perUserLimit, cutoff);
    const storedTweets = tweets.map(mapTweetForStorage);
    if (storedTweets.length > 0) {
      await convex.mutation('tweets:storeTweets', { tweets: storedTweets });
    }
    return { handle, count: storedTweets.length };
  });
}

async function fetchAndStoreForYou(count) {
  const client = await getClient();
  const result = await client.getHomeTimeline(parseCount(count));
  if (!result.success) {
    throw new Error(result.error ?? 'Home timeline failed');
  }

  const normalized = result.tweets.map((tweet) => ({
    ...mapTweetForStorage(tweet),
    sources: ['foryou'],
  }));
  const stored = await convex.mutation('tweets:storeTweets', { tweets: normalized });
  return { stored, count: normalized.length, tweets: result.tweets.map(mapTweet) };
}

app.post('/api/search', async (req, res, next) => {
  try {
    const { query, count } = req.body ?? {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    const client = await getClient();
    const result = await client.search(query.trim(), parseCount(count));
    if (!result.success) {
      return res.status(500).json({ error: result.error ?? 'Search failed' });
    }

    return res.json({
      tweets: result.tweets.map(mapTweet),
      nextCursor: result.nextCursor ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/home', async (req, res, next) => {
  try {
    const { count } = req.body ?? {};
    const client = await getClient();
    const result = await client.getHomeTimeline(parseCount(count));
    if (!result.success) {
      return res.status(500).json({ error: result.error ?? 'Home timeline failed' });
    }
    return res.json({ tweets: result.tweets.map(mapTweet) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/foryou/trigger', async (req, res, next) => {
  try {
    const { count } = req.body ?? {};
    const result = await fetchAndStoreForYou(count);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/foryou/score', async (req, res, next) => {
  try {
    const { count, top } = req.body ?? {};
    const limit = parseCount(count, 100);
    const topCount = Math.max(1, Math.min(50, clampNumber(top, 20)));

    const rows = await convex.query('tweets:getHistory', {
      source: 'foryou',
    });
    const candidates = rows.slice(0, limit);
    if (candidates.length === 0) {
      return res.json({ selected: 0, total: 0 });
    }

    const maxEngagement = Math.max(...candidates.map((tweet) => scoreTweetForDanKoe(tweet).engagement), 1);

    const scored = candidates.map((tweet) => {
      const { engagement, contentScore } = scoreTweetForDanKoe(tweet);
      const engagementScore = Math.log1p(engagement) / Math.log1p(maxEngagement);
      const score = 0.6 * engagementScore + 0.4 * contentScore;
      return { tweet, score, engagementScore, contentScore };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, topCount);

    let added = 0;
    for (const entry of selected) {
      const reasoning = buildSelectionReasoning(entry.tweet, entry);
      const videoScope = inferVideoScope(entry.tweet, entry);
      const result = await convex.mutation('scripts:addSelection', {
        tweetId: entry.tweet.tweetId ?? entry.tweet.id,
        handle: entry.tweet.authorUsername ?? entry.tweet.handle ?? '',
        reasoning,
        videoScope,
      });
      if (result?.added) {
        added += 1;
      }
    }

    return res.json({ selected: added, total: candidates.length });
  } catch (error) {
    return next(error);
  }
});

app.all('/api/cron/foryou', async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    const provided = req.query?.secret;
    if (!secret || provided !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = parseCount(req.query?.count, 50);
    const result = await fetchAndStoreForYou(count);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/fetch', async (req, res, next) => {
  try {
    const { handles } = req.body ?? {};
    const cleanedHandles = Array.isArray(handles)
      ? handles.map((handle) => (typeof handle === 'string' ? normalizeHandle(handle) : '')).filter(Boolean)
      : [];

    const handlesToFetch = cleanedHandles.length > 0 ? cleanedHandles : await getHandlesFromConvex();
    if (handlesToFetch.length === 0) {
      return res.status(400).json({ error: 'handles array is required' });
    }

    if (cleanedHandles.length > 0) {
      await convex.mutation('handles:upsertHandles', { handles: cleanedHandles });
    }

    const perUserResults = await fetchAndStoreTweets(handlesToFetch);

    return res.json({
      handles: perUserResults,
      storedCount: perUserResults.reduce((sum, entry) => sum + entry.count, 0),
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/handles', async (req, res, next) => {
  try {
    const { handles } = req.body ?? {};
    if (!Array.isArray(handles) || handles.length === 0) {
      return res.status(400).json({ error: 'handles array is required' });
    }

    const cleanedHandles = handles
      .map((handle) => (typeof handle === 'string' ? normalizeHandle(handle) : ''))
      .filter(Boolean);

    if (cleanedHandles.length === 0) {
      return res.status(400).json({ error: 'handles array is required' });
    }

    const result = await convex.mutation('handles:upsertHandles', { handles: cleanedHandles });
    return res.json({ count: result?.count ?? cleanedHandles.length });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/handles/remove', async (req, res, next) => {
  try {
    const { handle } = req.body ?? {};
    if (!handle || typeof handle !== 'string') {
      return res.status(400).json({ error: 'handle is required' });
    }
    const result = await convex.mutation('handles:removeHandle', { handle });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/handles', async (req, res, next) => {
  try {
    const { since } = req.query ?? {};
    const sinceMs = since ? Number(since) : undefined;
    const handles = await convex.query('handles:listHandlesWithStats', {
      since: Number.isFinite(sinceMs) ? sinceMs : undefined,
    });
    return res.json({ handles });
  } catch (error) {
    return next(error);
  }
});

app.all('/api/cron/fetch', async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const provided = req.headers['x-cron-secret'] ?? req.query?.secret;
      if (provided !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const handles = await getHandlesFromConvex();
    if (handles.length === 0) {
      return res.status(400).json({ error: 'No handles stored' });
    }

    const perUserResults = await fetchAndStoreTweets(handles);
    return res.json({
      handles: perUserResults,
      storedCount: perUserResults.reduce((sum, entry) => sum + entry.count, 0),
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/outliers', async (req, res, next) => {
  try {
    const { handles, count, window } = req.body ?? {};

    const resultCount = parseCount(count, 20);
    const cleanedHandles = Array.isArray(handles)
      ? handles.map((handle) => (typeof handle === 'string' ? normalizeHandle(handle) : '')).filter(Boolean)
      : await getHandlesFromConvex();

    if (cleanedHandles.length === 0) {
      return res.status(400).json({ error: 'No handles found. Run Fetch first.' });
    }

    const windowMs = resolveWindow(window);
    const now = Date.now();
    const cutoff = now - windowMs;

    const storedTweets = await convex.query('tweets:getTweetsByWindow', {
      handles: cleanedHandles,
      since: cutoff,
    });

    const perUserResults = cleanedHandles.map((handle) => {
      const recentTweets = storedTweets.filter((tweet) => tweet.handle === handle);
      if (recentTweets.length === 0) {
        return { handle, tweets: [] };
      }
      const engagements = recentTweets.map(engagementScore);
      const baseline = median(engagements);
      const scored = recentTweets.map((tweet) => mapOutlierTweet(tweet, Math.max(baseline, 1)));
      return { handle, tweets: scored };
    });

    const allTweets = perUserResults.flatMap((entry) => entry.tweets);
    const sorted = allTweets.sort((a, b) => {
      if (b.outlierScore !== a.outlierScore) {
        return b.outlierScore - a.outlierScore;
      }
      return b.engagement - a.engagement;
    });

    return res.json({
      tweets: sorted.slice(0, resultCount),
      totalCandidates: allTweets.length,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/matrix', async (req, res, next) => {
  try {
    const { handles, count, window } = req.body ?? {};
    const resultCount = parseCount(count, 20);
    const cleanedHandles = Array.isArray(handles)
      ? handles.map((handle) => (typeof handle === 'string' ? normalizeHandle(handle) : '')).filter(Boolean)
      : await getHandlesFromConvex();

    if (cleanedHandles.length === 0) {
      return res.status(400).json({ error: 'No handles found. Run Fetch first.' });
    }

    const now = Date.now();
    const cutoff = now - resolveWindow(window);

    const storedTweets = await convex.query('tweets:getTweetsByWindow', {
      handles: cleanedHandles,
      since: cutoff,
    });

    const perUserResults = cleanedHandles.map((handle) => ({
      handle,
      tweets: storedTweets.filter((tweet) => tweet.handle === handle),
    }));

    const allTweets = perUserResults.flatMap((entry) => entry.tweets.map(mapMatrixTweet));
    const sorted = allTweets.sort((a, b) => {
      if (b.engagement !== a.engagement) {
        return b.engagement - a.engagement;
      }
      return b.likeCount - a.likeCount;
    });

    return res.json({
      tweets: sorted.slice(0, resultCount),
      totalCandidates: allTweets.length,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/history', async (req, res, next) => {
  try {
    const {
      handle,
      text,
      start,
      end,
      source,
      sortBy,
      sortDir,
      minLikes,
      minRetweets,
      minReplies,
      minEngagement,
      page,
      pageSize,
    } = req.body ?? {};

    const startMs = start ? toTimestamp(start) : undefined;
    const endMs = end ? toTimestamp(end) : undefined;

    const handles = handle ? [normalizeHandle(handle)] : undefined;
    const size = Math.max(1, Math.min(100, clampNumber(pageSize, 20)));
    const pageNumber = Math.max(1, Math.floor(clampNumber(page, 1)));

    const rows = await convex.query('tweets:getHistory', {
      handles,
      source: typeof source === 'string' ? source : undefined,
      since: startMs,
      until: endMs,
      text: typeof text === 'string' ? text : undefined,
      minLikes: normalizeOptionalNumber(minLikes),
      minRetweets: normalizeOptionalNumber(minRetweets),
      minReplies: normalizeOptionalNumber(minReplies),
      minEngagement: normalizeOptionalNumber(minEngagement),
    });

    if (rows.length === 0) {
      return res.json({
        tweets: [],
        total: 0,
        page: pageNumber,
        pageSize: size,
        totalPages: 0,
      });
    }

    const engagementsByHandle = new Map();
    for (const row of rows) {
      const list = engagementsByHandle.get(row.handle) ?? [];
      list.push(row.engagement ?? engagementScore(row));
      engagementsByHandle.set(row.handle, list);
    }

    const baselineByHandle = new Map();
    for (const [handleKey, values] of engagementsByHandle.entries()) {
      baselineByHandle.set(handleKey, Math.max(median(values), 1));
    }

    const enriched = rows.map((row) => {
      const baseline = baselineByHandle.get(row.handle) ?? 1;
      const engagement = row.engagement ?? engagementScore(row);
      return {
        ...mapTweet(row),
        engagement,
        outlierScore: engagement / baseline,
        baselineMedian: baseline,
      };
    });

    const direction = sortDir === 'asc' ? 1 : -1;
    const sortKey = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const sorted = [...enriched].sort((a, b) => {
      const getValue = (item) => {
        switch (sortKey) {
          case 'likes':
            return item.likeCount ?? 0;
          case 'retweets':
            return item.retweetCount ?? 0;
          case 'replies':
            return item.replyCount ?? 0;
          case 'engagement':
            return item.engagement ?? 0;
          case 'outlier':
            return item.outlierScore ?? 0;
          case 'createdAt':
          default:
            return item.createdAt ?? 0;
        }
      };
      return (getValue(a) - getValue(b)) * direction;
    });

    const total = sorted.length;
    const totalPages = Math.ceil(total / size);
    const offset = (pageNumber - 1) * size;
    const paged = sorted.slice(offset, offset + size);

    return res.json({
      tweets: paged,
      total,
      page: pageNumber,
      pageSize: size,
      totalPages,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/history/remove', async (req, res, next) => {
  try {
    const { tweetId } = req.body ?? {};
    if (!tweetId) {
      return res.status(400).json({ error: 'tweetId is required' });
    }
    const result = await convex.mutation('tweets:removeTweet', { tweetId });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/script/generate', async (req, res, next) => {
  try {
    const { model, prompt, tweetIds, templateId } = req.body ?? {};
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'model is required' });
    }
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    if (!Array.isArray(tweetIds) || tweetIds.length === 0) {
      return res.status(400).json({ error: 'tweetIds is required' });
    }

    const selected = await getTweetsByIds(tweetIds);
    if (selected.length === 0) {
      return res.status(400).json({ error: 'No tweets found for selection' });
    }
    const context = selected.map((tweet) => {
      return {
        author: `@${tweet.authorUsername}`,
        text: tweet.text,
        likes: tweet.likeCount,
        retweets: tweet.retweetCount,
        replies: tweet.replyCount,
        engagement: tweet.engagement,
        url: tweet.url,
      };
    });

    let templateContent = '';
    if (templateId) {
      const templates = await convex.query('templates:listTemplates');
      const template = templates.find((item) => item._id === templateId);
      if (template) {
        templateContent = template.content;
      }
    }

    const summary = await summarizeTweets({ model, tweets: selected });

    const messages = [
      { role: 'system', content: 'You are a helpful YouTube script writer.' },
      {
        role: 'user',
        content: `${prompt}\n\nTemplate:\n${templateContent}\n\nTweet Context:\n${JSON.stringify(
          context,
          null,
          2,
        )}\n\nSummary JSON:\n${summary}`,
      },
    ];

    const output = await callOpenRouter({ model, messages });
    await convex.mutation('scripts:saveScript', { model, prompt, output });
    return res.json({ output });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/templates', async (req, res, next) => {
  try {
    const templates = await convex.query('templates:listTemplates');
    return res.json({ templates });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/templates', async (req, res, next) => {
  try {
    const { name, content } = req.body ?? {};
    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' });
    }
    const result = await convex.mutation('templates:addTemplate', { name, content });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/script/selection/add', async (req, res, next) => {
  try {
    const { tweetId, handle } = req.body ?? {};
    if (!tweetId || !handle) {
      return res.status(400).json({ error: 'tweetId and handle are required' });
    }
    const result = await convex.mutation('scripts:addSelection', {
      tweetId,
      handle: normalizeHandle(handle),
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/script/selection/remove', async (req, res, next) => {
  try {
    const { tweetId } = req.body ?? {};
    if (!tweetId) {
      return res.status(400).json({ error: 'tweetId is required' });
    }
    const result = await convex.mutation('scripts:removeSelection', { tweetId });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/script/selections', async (req, res, next) => {
  try {
    const selections = await convex.query('scripts:listSelections');
    const tweetIds = selections.map((item) => item.tweetId);
    const tweets = await getTweetsByIds(tweetIds);
    const tweetMap = new Map(tweets.map((tweet) => [tweet.tweetId, tweet]));

    const enriched = selections.map((item) => ({
      ...item,
      tweet: tweetMap.get(item.tweetId) ?? null,
    }));
    return res.json({ selections: enriched });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/script/selections/clear', async (req, res, next) => {
  try {
    const result = await convex.mutation('scripts:clearSelections');
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/script/history', async (req, res, next) => {
  try {
    const scripts = await convex.query('scripts:listScripts');
    return res.json({ scripts });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/user-tweets', async (req, res, next) => {
  try {
    const { handle, count } = req.body ?? {};
    if (!handle || typeof handle !== 'string' || !handle.trim()) {
      return res.status(400).json({ error: 'handle is required' });
    }

    const client = await getClient();
    const cleanHandle = normalizeHandle(handle);
    const lookup = await client.getUserIdByUsername(cleanHandle);
    if (!lookup.success || !lookup.userId) {
      return res.status(404).json({ error: lookup.error ?? 'User not found' });
    }

    const result = await client.getUserTweets(lookup.userId, parseCount(count));
    if (!result.success) {
      return res.status(500).json({ error: result.error ?? 'User tweets failed' });
    }

    return res.json({
      tweets: result.tweets.map(mapTweet),
      user: {
        id: lookup.userId,
        username: lookup.username ?? cleanHandle,
        name: lookup.name ?? null,
      },
      nextCursor: result.nextCursor ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error?.message ?? 'Server error' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Bird UI running on http://localhost:${port}`);
});
