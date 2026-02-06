const searchForm = document.getElementById('search-form');
const userForm = document.getElementById('user-form');
const analyzeForm = document.getElementById('analyze-form');
const analyzeMode = document.getElementById('analyze-mode');
const analyzeHandles = document.getElementById('analyze-handles');
const analyzeCount = document.getElementById('analyze-count');
const analyzeWindow = document.getElementById('analyze-window');
const analyzeOutlierToggle = document.getElementById('analyze-outlier-toggle');
const analyzeCountField = document.getElementById('analyze-count-field');
const analyzeWindowField = document.getElementById('analyze-window-field');
const analyzeOutlierField = document.getElementById('analyze-outlier-field');
const saveHandlesButton = document.getElementById('save-handles-button');
const statusEl = document.getElementById('status');
const resultsBody = document.getElementById('results-body');
const searchButton = document.getElementById('search-button');
const userButton = document.getElementById('user-button');
const analyzeButton = document.getElementById('analyze-button');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b91c1c' : '#1a1a1a';
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  userButton.disabled = isLoading;
  analyzeButton.disabled = isLoading;
  saveHandlesButton.disabled = isLoading;
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function clearResults() {
  resultsBody.innerHTML = '';
}

function setOutlierColumnsVisible(isVisible) {
  const columns = document.querySelectorAll('.outlier-column');
  columns.forEach((column) => {
    if (isVisible) {
      column.classList.remove('hidden');
    } else {
      column.classList.add('hidden');
    }
  });
}

function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return Number(value).toFixed(2);
}

function renderResults(tweets, options = {}) {
  clearResults();
  if (!tweets || tweets.length === 0) {
    setStatus('No results found.');
    return;
  }

  const showOutlierScore = options.showOutlierScore ?? analyzeOutlierToggle.checked;

  for (const tweet of tweets) {
    const row = document.createElement('tr');

    const textCell = document.createElement('td');
    textCell.className = 'text-cell';
    textCell.textContent = tweet.text || '';
    row.appendChild(textCell);

    const authorCell = document.createElement('td');
    authorCell.textContent = tweet.authorName
      ? `${tweet.authorName} (@${tweet.authorUsername})`
      : `@${tweet.authorUsername || ''}`;
    row.appendChild(authorCell);

    const timeCell = document.createElement('td');
    timeCell.textContent = formatDate(tweet.createdAt);
    row.appendChild(timeCell);

    const repliesCell = document.createElement('td');
    repliesCell.textContent = String(tweet.replyCount ?? 0);
    row.appendChild(repliesCell);

    const retweetsCell = document.createElement('td');
    retweetsCell.textContent = String(tweet.retweetCount ?? 0);
    row.appendChild(retweetsCell);

    const likesCell = document.createElement('td');
    likesCell.textContent = String(tweet.likeCount ?? 0);
    row.appendChild(likesCell);

    const engagementCell = document.createElement('td');
    engagementCell.textContent =
      tweet.engagement !== undefined && tweet.engagement !== null ? String(tweet.engagement) : '';
    row.appendChild(engagementCell);

    const scoreCell = document.createElement('td');
    scoreCell.textContent = formatScore(tweet.outlierScore);
    scoreCell.className = 'outlier-column';
    row.appendChild(scoreCell);

    const linkCell = document.createElement('td');
    if (tweet.url) {
      const link = document.createElement('a');
      link.href = tweet.url;
      link.textContent = 'Open';
      link.target = '_blank';
      link.rel = 'noreferrer';
      linkCell.appendChild(link);
    } else {
      linkCell.textContent = '';
    }
    row.appendChild(linkCell);

    resultsBody.appendChild(row);
  }

  setOutlierColumnsVisible(showOutlierScore);
  const statusMessage = options.statusMessage ?? `Showing ${tweets.length} results.`;
  setStatus(statusMessage);
}

async function requestJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error || 'Request failed.';
    throw new Error(message);
  }
  return data;
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoading(true);
  setStatus('Searching...');

  try {
    const query = document.getElementById('search-query').value.trim();
    const count = document.getElementById('search-count').value;
    const data = await requestJson('/api/search', { query, count });
    renderResults(data.tweets);
  } catch (error) {
    clearResults();
    setStatus(error.message || 'Search failed.', true);
  } finally {
    setLoading(false);
  }
});

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoading(true);
  setStatus('Fetching user tweets...');

  try {
    const handle = document.getElementById('user-handle').value.trim();
    const count = document.getElementById('user-count').value;
    const data = await requestJson('/api/user-tweets', { handle, count });
    renderResults(data.tweets);
  } catch (error) {
    clearResults();
    setStatus(error.message || 'User fetch failed.', true);
  } finally {
    setLoading(false);
  }
});

function parseHandles(value) {
  return value
    .split(/[\n,]+/)
    .map((handle) => handle.trim())
    .filter(Boolean);
}

function updateAnalyzeMode() {
  const mode = analyzeMode.value;
  const showCount = mode !== 'fetch';
  const showWindow = mode !== 'fetch';
  const showOutlier = mode === 'outliers';

  analyzeCountField.classList.toggle('hidden', !showCount);
  analyzeWindowField.classList.toggle('hidden', !showWindow);
  analyzeOutlierField.classList.toggle('hidden', !showOutlier);

  if (!showOutlier) {
    setOutlierColumnsVisible(false);
  } else {
    setOutlierColumnsVisible(analyzeOutlierToggle.checked);
  }

  if (mode === 'fetch') {
    analyzeButton.textContent = 'Fetch into Cache';
  } else if (mode === 'matrix') {
    analyzeButton.textContent = 'Find Matrix Tweets';
  } else {
    analyzeButton.textContent = 'Find Outliers';
  }
}

analyzeMode.addEventListener('change', updateAnalyzeMode);
analyzeOutlierToggle.addEventListener('change', () => {
  if (analyzeMode.value === 'outliers') {
    setOutlierColumnsVisible(analyzeOutlierToggle.checked);
  }
});

analyzeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoading(true);
  const mode = analyzeMode.value;
  setStatus(
    mode === 'fetch'
      ? 'Fetching tweets into cache...'
      : mode === 'matrix'
        ? 'Finding matrix tweets...'
        : 'Finding outliers...',
  );

  try {
    const handles = parseHandles(analyzeHandles.value);

    if (mode === 'fetch') {
      if (handles.length === 0) {
        setStatus('Please provide at least one handle to fetch.', true);
        return;
      }
      const data = await requestJson('/api/fetch', { handles });
      setStatus(`Fetched ${data.storedCount ?? 0} tweets across ${handles.length} handles.`);
      clearResults();
      return;
    }

    const count = analyzeCount.value;
    const window = analyzeWindow.value;

    if (mode === 'matrix') {
      const payload = { count, window };
      if (handles.length > 0) {
        payload.handles = handles;
      }
      const data = await requestJson('/api/matrix', payload);
      const tweets = data.tweets ?? [];
      renderResults(tweets, { statusMessage: `Showing ${tweets.length} results.` });
      return;
    }

    const payload = { count, window };
    if (handles.length > 0) {
      payload.handles = handles;
    }
    const data = await requestJson('/api/outliers', payload);
    const tweets = data.tweets ?? [];
    const topScore = tweets.length ? formatScore(tweets[0].outlierScore) : null;
    const suffix = topScore ? ` Top score: ${topScore}.` : '';
    renderResults(tweets, {
      statusMessage: `Showing ${tweets.length} results.${suffix}`,
      showOutlierScore: analyzeOutlierToggle.checked,
    });
  } catch (error) {
    clearResults();
    setStatus(error.message || 'Analyze failed.', true);
  } finally {
    setLoading(false);
  }
});

saveHandlesButton.addEventListener('click', async () => {
  setLoading(true);
  setStatus('Saving handles...');

  try {
    const handles = parseHandles(analyzeHandles.value);
    if (handles.length === 0) {
      setStatus('Please provide at least one handle.', true);
      return;
    }

    const data = await requestJson('/api/handles', { handles });
    setStatus(`Saved ${data.count ?? handles.length} handles.`);
  } catch (error) {
    setStatus(error.message || 'Save handles failed.', true);
  } finally {
    setLoading(false);
  }
});

updateAnalyzeMode();
