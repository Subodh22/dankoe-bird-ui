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

    const total = enriched.length;
    const totalPages = Math.ceil(total / size);
    const offset = (pageNumber - 1) * size;
    const paged = enriched.slice(offset, offset + size);

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
