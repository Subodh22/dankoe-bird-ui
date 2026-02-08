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
const tabAnalyze = document.getElementById('tab-analyze');
const tabHistory = document.getElementById('tab-history');
const tabHandles = document.getElementById('tab-handles');
const tabBird = document.getElementById('tab-bird');
const tabForYou = document.getElementById('tab-foryou');
const tabScript = document.getElementById('tab-script');
const analyzeView = document.getElementById('analyze-view');
const historyView = document.getElementById('history-view');
const handlesView = document.getElementById('handles-view');
const birdView = document.getElementById('bird-view');
const forYouView = document.getElementById('foryou-view');
const scriptView = document.getElementById('script-view');
const historyForm = document.getElementById('history-form');
const historyStart = document.getElementById('history-start');
const historyEnd = document.getElementById('history-end');
const historyHandle = document.getElementById('history-handle');
const historyText = document.getElementById('history-text');
const historyMinLikes = document.getElementById('history-min-likes');
const historyMinRetweets = document.getElementById('history-min-retweets');
const historyMinReplies = document.getElementById('history-min-replies');
const historyMinEngagement = document.getElementById('history-min-engagement');
const historySource = document.getElementById('history-source');
const historyPageSize = document.getElementById('history-page-size');
const historyResultsBody = document.getElementById('history-results-body');
const historyPrev = document.getElementById('history-prev');
const historyNext = document.getElementById('history-next');
const historyPageInfo = document.getElementById('history-page-info');
const historyStatus = document.getElementById('history-status');
const handlesGrid = document.getElementById('handles-grid');
const handlesHistoryForm = document.getElementById('handles-history-form');
const handlesHistoryHandle = document.getElementById('handles-history-handle');
const handlesHistoryStart = document.getElementById('handles-history-start');
const handlesHistoryEnd = document.getElementById('handles-history-end');
const handlesHistoryText = document.getElementById('handles-history-text');
const handlesHistoryMinLikes = document.getElementById('handles-history-min-likes');
const handlesHistoryMinRetweets = document.getElementById('handles-history-min-retweets');
const handlesHistoryMinReplies = document.getElementById('handles-history-min-replies');
const handlesHistoryMinEngagement = document.getElementById('handles-history-min-engagement');
const handlesHistoryPageSize = document.getElementById('handles-history-page-size');
const handlesHistoryResults = document.getElementById('handles-history-results');
const handlesHistoryPrev = document.getElementById('handles-history-prev');
const handlesHistoryNext = document.getElementById('handles-history-next');
const handlesHistoryPageInfo = document.getElementById('handles-history-page-info');
const handlesHistoryStatus = document.getElementById('handles-history-status');
const birdForm = document.getElementById('bird-form');
const birdQuery = document.getElementById('bird-query');
const birdCount = document.getElementById('bird-count');
const birdPresets = document.getElementById('bird-presets');
const birdResultsBody = document.getElementById('bird-results-body');
const birdStatus = document.getElementById('bird-status');
const birdSearchButton = document.getElementById('bird-search-button');
const forYouForm = document.getElementById('foryou-form');
const forYouCount = document.getElementById('foryou-count');
const forYouRefresh = document.getElementById('foryou-refresh');
const forYouSave = document.getElementById('foryou-save');
const forYouScore = document.getElementById('foryou-score');
const forYouResultsBody = document.getElementById('foryou-results-body');
const forYouStatus = document.getElementById('foryou-status');
const scriptForm = document.getElementById('script-form');
const scriptModel = document.getElementById('script-model');
const scriptModelPresets = document.getElementById('script-model-presets');
const scriptTemplateSelect = document.getElementById('script-template-select');
const scriptTemplateName = document.getElementById('script-template-name');
const scriptTemplateContent = document.getElementById('script-template-content');
const scriptSaveTemplate = document.getElementById('script-save-template');
const scriptPrompt = document.getElementById('script-prompt');
const scriptGenerate = document.getElementById('script-generate');
const scriptGenerateInline = document.getElementById('script-generate-inline');
const scriptClear = document.getElementById('script-clear');
const scriptSelectionList = document.getElementById('script-selection-list');
const scriptHistory = document.getElementById('script-history');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const statusSpinner = document.getElementById('status-spinner');
const resultsBody = document.getElementById('results-body');
const searchButton = document.getElementById('search-button');
const userButton = document.getElementById('user-button');
const analyzeButton = document.getElementById('analyze-button');

let historyPage = 1;
let historyTotalPages = 0;
let historyLastFilters = null;
let handlesHistoryPage = 1;
let handlesHistoryTotalPages = 0;
let handlesHistoryFilters = null;

function setStatus(message, isError = false) {
  if (statusText) {
    statusText.textContent = message;
  } else {
    statusEl.textContent = message;
  }
  statusEl.style.color = isError ? '#b91c1c' : '#9aa4b2';
}

function setStatusSpinner(isVisible) {
  if (!statusSpinner) {
    return;
  }
  statusSpinner.classList.toggle('hidden', !isVisible);
}

function setHistoryStatus(message, isError = false) {
  historyStatus.textContent = message;
  historyStatus.style.color = isError ? '#b91c1c' : '#9aa4b2';
}

function setHandlesHistoryStatus(message, isError = false) {
  handlesHistoryStatus.textContent = message;
  handlesHistoryStatus.style.color = isError ? '#b91c1c' : '#9aa4b2';
}

function setBirdStatus(message, isError = false) {
  if (!birdStatus) {
    return;
  }
  birdStatus.textContent = message;
  birdStatus.style.color = isError ? '#b91c1c' : '#9aa4b2';
}

function setForYouStatus(message, isError = false) {
  if (!forYouStatus) {
    return;
  }
  forYouStatus.textContent = message;
  forYouStatus.style.color = isError ? '#b91c1c' : '#9aa4b2';
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  userButton.disabled = isLoading;
  analyzeButton.disabled = isLoading;
  saveHandlesButton.disabled = isLoading;
  if (birdSearchButton) {
    birdSearchButton.disabled = isLoading;
  }
  if (forYouRefresh) {
    forYouRefresh.disabled = isLoading;
  }
  if (forYouSave) {
    forYouSave.disabled = isLoading;
  }
  if (forYouScore) {
    forYouScore.disabled = isLoading;
  }
  scriptGenerate.disabled = isLoading;
  scriptClear.disabled = isLoading;
  scriptGenerateInline.disabled = isLoading;
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

function clearHistoryResults() {
  historyResultsBody.innerHTML = '';
}

function clearHandlesHistoryResults() {
  handlesHistoryResults.innerHTML = '';
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

function renderMediaThumbnails(container, tweet) {
  if (!tweet?.media || tweet.media.length === 0) {
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'media-thumbs';

  tweet.media.forEach((media) => {
    const src = media.previewUrl || media.url;
    if (!src) {
      return;
    }
    const link = document.createElement('a');
    link.href = media.videoUrl || media.url || tweet.url || '#';
    link.target = '_blank';
    link.rel = 'noreferrer';

    const img = document.createElement('img');
    img.src = src;
    img.alt = media.type ? `${media.type} thumbnail` : 'media thumbnail';

    link.appendChild(img);
    wrapper.appendChild(link);
  });

  if (wrapper.childNodes.length > 0) {
    container.appendChild(wrapper);
  }
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
    renderMediaThumbnails(textCell, tweet);
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

function renderHistoryResults(tweets) {
  clearHistoryResults();
  if (!tweets || tweets.length === 0) {
    setHistoryStatus('No history results found.');
    return;
  }

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

    historyResultsBody.appendChild(row);
  }

  setHistoryStatus(`Showing ${tweets.length} results.`);
}

function renderHandlesHistoryResults(tweets) {
  clearHandlesHistoryResults();
  if (!tweets || tweets.length === 0) {
    setHandlesHistoryStatus('No history results found.');
    return;
  }

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

    const scriptCell = document.createElement('td');
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add';
    addButton.className = 'secondary';
    addButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/script/selection/add', {
          tweetId: tweet.id,
          handle: tweet.authorUsername,
        });
        await loadScriptSelections();
        setHandlesHistoryStatus('Added to script.');
      } catch (error) {
        setHandlesHistoryStatus(error.message || 'Failed to add to script.', true);
      }
    });
    scriptCell.appendChild(addButton);
    row.appendChild(scriptCell);

    handlesHistoryResults.appendChild(row);
  }

  setHandlesHistoryStatus(`Showing ${tweets.length} results.`);
}

function renderBirdResults(tweets) {
  birdResultsBody.innerHTML = '';
  if (!tweets || tweets.length === 0) {
    setBirdStatus('No results found.');
    return;
  }

  for (const tweet of tweets) {
    const row = document.createElement('tr');

    const textCell = document.createElement('td');
    textCell.className = 'text-cell';
    textCell.textContent = tweet.text || '';
    renderMediaThumbnails(textCell, tweet);
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

    const actionsCell = document.createElement('td');
    const actionsRow = document.createElement('div');
    actionsRow.className = 'row';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'secondary';
    selectButton.textContent = 'Select for Script';
    selectButton.disabled = !tweet.id || !tweet.authorUsername;
    selectButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/script/selection/add', {
          tweetId: tweet.id,
          handle: tweet.authorUsername,
        });
        await loadScriptSelections();
        setBirdStatus('Added to script selection.');
      } catch (error) {
        setBirdStatus(error.message || 'Failed to add selection.', true);
      }
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'secondary';
    saveButton.textContent = 'Save Handle';
    saveButton.disabled = !tweet.authorUsername;
    saveButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/handles', { handles: [tweet.authorUsername] });
        setBirdStatus(`Saved @${tweet.authorUsername}.`);
      } catch (error) {
        setBirdStatus(error.message || 'Failed to save handle.', true);
      }
    });

    actionsRow.appendChild(selectButton);
    actionsRow.appendChild(saveButton);
    actionsCell.appendChild(actionsRow);
    row.appendChild(actionsCell);

    birdResultsBody.appendChild(row);
  }

  setBirdStatus(`Showing ${tweets.length} results.`);
}

function renderForYouResults(tweets) {
  forYouResultsBody.innerHTML = '';
  if (!tweets || tweets.length === 0) {
    setForYouStatus('No results found.');
    return;
  }

  for (const tweet of tweets) {
    const row = document.createElement('tr');

    const textCell = document.createElement('td');
    textCell.className = 'text-cell';
    textCell.textContent = tweet.text || '';
    renderMediaThumbnails(textCell, tweet);
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

    const actionsCell = document.createElement('td');
    const actionsRow = document.createElement('div');
    actionsRow.className = 'row';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'secondary';
    selectButton.textContent = 'Select for Script';
    selectButton.disabled = !tweet.id || !tweet.authorUsername;
    selectButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/script/selection/add', {
          tweetId: tweet.id,
          handle: tweet.authorUsername,
        });
        await loadScriptSelections();
        setForYouStatus('Added to script selection.');
      } catch (error) {
        setForYouStatus(error.message || 'Failed to add selection.', true);
      }
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'secondary';
    saveButton.textContent = 'Save Handle';
    saveButton.disabled = !tweet.authorUsername;
    saveButton.addEventListener('click', async () => {
      try {
        await requestJson('/api/handles', { handles: [tweet.authorUsername] });
        setForYouStatus(`Saved @${tweet.authorUsername}.`);
      } catch (error) {
        setForYouStatus(error.message || 'Failed to save handle.', true);
      }
    });

    actionsRow.appendChild(selectButton);
    actionsRow.appendChild(saveButton);
    actionsCell.appendChild(actionsRow);
    row.appendChild(actionsCell);

    forYouResultsBody.appendChild(row);
  }

  setForYouStatus(`Showing ${tweets.length} results.`);
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

async function fetchBirdSearch(query, count) {
  setLoading(true);
  setBirdStatus('Searching...');
  try {
    const data = await requestJson('/api/search', { query, count });
    renderBirdResults(data.tweets);
  } catch (error) {
    birdResultsBody.innerHTML = '';
    setBirdStatus(error.message || 'Search failed.', true);
  } finally {
    setLoading(false);
  }
}

async function fetchForYou(count) {
  setLoading(true);
  setForYouStatus('Loading For You feed...');
  try {
    const data = await requestJson('/api/home', { count });
    renderForYouResults(data.tweets);
  } catch (error) {
    forYouResultsBody.innerHTML = '';
    setForYouStatus(error.message || 'For You feed failed.', true);
  } finally {
    setLoading(false);
  }
}

async function runForYouSave(count) {
  setLoading(true);
  setForYouStatus('Saving For You feed...');
  try {
    const data = await requestJson('/api/foryou/trigger', { count });
    setForYouStatus(`Saved ${data?.stored?.inserted ?? 0} new tweets.`);
  } catch (error) {
    setForYouStatus(error.message || 'For You save failed.', true);
  } finally {
    setLoading(false);
  }
}

async function scoreForYouTweets({ count = 100, top = 20 } = {}) {
  setLoading(true);
  setForYouStatus('Scoring tweets for scripts...');
  try {
    const data = await requestJson('/api/foryou/score', { count, top });
    setForYouStatus(`Selected ${data.selected ?? 0} tweets for scripts.`);
    await loadScriptSelections();
  } catch (error) {
    setForYouStatus(error.message || 'Tweet scoring failed.', true);
  } finally {
    setLoading(false);
  }
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

if (birdForm) {
  birdForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = birdQuery.value.trim();
    if (!query) {
      setBirdStatus('Please provide a query.', true);
      return;
    }
    const count = birdCount.value;
    await fetchBirdSearch(query, count);
  });
}

if (birdPresets) {
  birdPresets.querySelectorAll('button[data-query]').forEach((button) => {
    button.addEventListener('click', async () => {
      const query = button.getAttribute('data-query');
      if (!query) {
        return;
      }
      birdQuery.value = query;
      const count = birdCount.value;
      await fetchBirdSearch(query, count);
    });
  });
}

if (forYouForm) {
  forYouForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const count = forYouCount.value;
    await fetchForYou(count);
  });
}

if (forYouSave) {
  forYouSave.addEventListener('click', async () => {
    const count = forYouCount.value;
    await runForYouSave(count);
  });
}

if (forYouScore) {
  forYouScore.addEventListener('click', async () => {
    await scoreForYouTweets({ count: 100, top: 20 });
  });
}

function parseHandles(value) {
  return value
    .split(/[\n,]+/)
    .map((handle) => handle.trim())
    .filter(Boolean);
}

function setActiveTab(tab) {
  const isAnalyze = tab === 'analyze';
  const isHistory = tab === 'history';
  const isHandles = tab === 'handles';
  const isBird = tab === 'bird';
  const isForYou = tab === 'foryou';
  const isScript = tab === 'script';
  tabAnalyze.classList.toggle('active', isAnalyze);
  tabHistory.classList.toggle('active', isHistory);
  tabHandles.classList.toggle('active', isHandles);
  tabBird.classList.toggle('active', isBird);
  tabForYou.classList.toggle('active', isForYou);
  tabScript.classList.toggle('active', isScript);
  analyzeView.classList.toggle('hidden', !isAnalyze);
  historyView.classList.toggle('hidden', !isHistory);
  handlesView.classList.toggle('hidden', !isHandles);
  birdView.classList.toggle('hidden', !isBird);
  forYouView.classList.toggle('hidden', !isForYou);
  scriptView.classList.toggle('hidden', !isScript);
}

function normalizeMinValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function getHistoryFilters() {
  const filters = {
    start: historyStart.value || undefined,
    end: historyEnd.value || undefined,
    handle: historyHandle.value.trim() || undefined,
    text: historyText.value.trim() || undefined,
    minLikes: normalizeMinValue(historyMinLikes.value),
    minRetweets: normalizeMinValue(historyMinRetweets.value),
    minReplies: normalizeMinValue(historyMinReplies.value),
    minEngagement: normalizeMinValue(historyMinEngagement.value),
    source: historySource?.value || undefined,
    pageSize: historyPageSize.value || 20,
  };
  return filters;
}

async function fetchHistory(pageNumber) {
  setHistoryStatus('Loading history...');
  const filters = historyLastFilters ?? getHistoryFilters();
  historyLastFilters = filters;

  const payload = {
    ...filters,
    page: pageNumber,
  };

  const data = await requestJson('/api/history', payload);
  historyPage = data.page ?? pageNumber;
  historyTotalPages = data.totalPages ?? 0;
  historyPageInfo.textContent = historyTotalPages
    ? `Page ${historyPage} of ${historyTotalPages}`
    : `Page ${historyPage}`;
  historyPrev.disabled = historyPage <= 1;
  historyNext.disabled = historyTotalPages === 0 || historyPage >= historyTotalPages;
  renderHistoryResults(data.tweets ?? []);
}

function getHandlesHistoryFilters() {
  return {
    start: handlesHistoryStart.value || undefined,
    end: handlesHistoryEnd.value || undefined,
    handle: handlesHistoryHandle.value.trim() || undefined,
    text: handlesHistoryText.value.trim() || undefined,
    minLikes: normalizeMinValue(handlesHistoryMinLikes.value),
    minRetweets: normalizeMinValue(handlesHistoryMinRetweets.value),
    minReplies: normalizeMinValue(handlesHistoryMinReplies.value),
    minEngagement: normalizeMinValue(handlesHistoryMinEngagement.value),
    pageSize: handlesHistoryPageSize.value || 20,
  };
}

async function fetchHandlesHistory(pageNumber) {
  setHandlesHistoryStatus('Loading history...');
  const filters = handlesHistoryFilters ?? getHandlesHistoryFilters();
  handlesHistoryFilters = filters;

  const payload = {
    ...filters,
    page: pageNumber,
  };

  const data = await requestJson('/api/history', payload);
  handlesHistoryPage = data.page ?? pageNumber;
  handlesHistoryTotalPages = data.totalPages ?? 0;
  handlesHistoryPageInfo.textContent = handlesHistoryTotalPages
    ? `Page ${handlesHistoryPage} of ${handlesHistoryTotalPages}`
    : `Page ${handlesHistoryPage}`;
  handlesHistoryPrev.disabled = handlesHistoryPage <= 1;
  handlesHistoryNext.disabled =
    handlesHistoryTotalPages === 0 || handlesHistoryPage >= handlesHistoryTotalPages;
  renderHandlesHistoryResults(data.tweets ?? []);
}

async function loadHandlesGrid() {
  handlesGrid.innerHTML = '';
  const response = await fetch('/api/handles');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to load handles.');
  }
  const handles = data.handles ?? [];
  if (!handles.length) {
    handlesGrid.innerHTML = '<div class="muted">No handles saved yet.</div>';
    return;
  }

  for (const handle of handles) {
    const card = document.createElement('div');
    card.className = 'card-mini';

    const title = document.createElement('strong');
    title.textContent = `@${handle.handle}`;
    card.appendChild(title);

    const stats = document.createElement('div');
    stats.className = 'metric';
    stats.textContent = `Tweets: ${handle.tweetCount} · Avg engagement: ${handle.avgEngagement.toFixed(
      1,
    )}`;
    card.appendChild(stats);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'View History';
    button.addEventListener('click', async () => {
      handlesHistoryHandle.value = `@${handle.handle}`;
      handlesHistoryFilters = getHandlesHistoryFilters();
      handlesHistoryPage = 1;
      await fetchHandlesHistory(handlesHistoryPage);
    });
    card.appendChild(button);

    handlesGrid.appendChild(card);
  }
}

async function loadScriptSelections() {
  scriptSelectionList.innerHTML = '';
  const response = await fetch('/api/script/selections');
  const data = await response.json();
  if (!response.ok) {
    scriptSelectionList.innerHTML = '<div class="muted">Failed to load selection.</div>';
    return;
  }
  const selections = data.selections ?? [];
  if (selections.length === 0) {
    scriptSelectionList.innerHTML = '<div class="muted">No tweets selected.</div>';
    return;
  }

  for (const item of selections) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-mini';

    const title = document.createElement('strong');
    title.textContent = `@${item.handle}`;
    wrapper.appendChild(title);

    const text = document.createElement('div');
    text.className = 'metric';
    text.textContent = item.tweet?.text ?? 'Tweet not found';
    wrapper.appendChild(text);

    const metrics = document.createElement('div');
    metrics.className = 'metric';
    const replies = item.tweet?.replyCount ?? 0;
    const retweets = item.tweet?.retweetCount ?? 0;
    const likes = item.tweet?.likeCount ?? 0;
    const engagement = item.tweet?.engagement ?? replies + retweets + likes;
    metrics.textContent = `Replies ${replies} · Retweets ${retweets} · Likes ${likes} · Engagement ${engagement}`;
    wrapper.appendChild(metrics);

    if (item.tweet?.url) {
      const link = document.createElement('a');
      link.href = item.tweet.url;
      link.textContent = 'Open tweet';
      link.target = '_blank';
      link.rel = 'noreferrer';
      wrapper.appendChild(link);
    }

    if (item.reasoning) {
      const reasoning = document.createElement('div');
      reasoning.className = 'metric';
      reasoning.textContent = `Why: ${item.reasoning}`;
      wrapper.appendChild(reasoning);
    }
    if (item.videoScope) {
      const scope = document.createElement('div');
      scope.className = 'metric';
      scope.textContent = `Scope: ${item.videoScope}`;
      wrapper.appendChild(scope);
    }

    const actions = document.createElement('div');
    actions.className = 'row';

    const generateBtn = document.createElement('button');
    generateBtn.type = 'button';
    generateBtn.textContent = 'Generate Script';
    generateBtn.addEventListener('click', async () => {
      await generateScriptFromSelections({ switchToScriptTab: true });
    });
    actions.appendChild(generateBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await requestJson('/api/script/selection/remove', { tweetId: item.tweetId });
      await loadScriptSelections();
    });
    actions.appendChild(removeBtn);

    wrapper.appendChild(actions);

    scriptSelectionList.appendChild(wrapper);
  }
}

async function loadScriptHistory() {
  scriptHistory.innerHTML = '';
  const response = await fetch('/api/script/history');
  const data = await response.json();
  if (!response.ok) {
    scriptHistory.innerHTML = '<div class="muted">Failed to load scripts.</div>';
    return;
  }
  const scripts = data.scripts ?? [];
  if (!scripts.length) {
    scriptHistory.innerHTML = '<div class="muted">No scripts generated yet.</div>';
    return;
  }
  for (const script of scripts) {
    const card = document.createElement('div');
    card.className = 'card-mini';

    const title = document.createElement('strong');
    title.textContent = script.model;
    card.appendChild(title);

    const text = document.createElement('div');
    text.className = 'metric script-output';
    text.textContent = script.output;
    card.appendChild(text);

    scriptHistory.appendChild(card);
  }
}

async function loadTemplates() {
  scriptTemplateSelect.innerHTML = '<option value="">Select template</option>';
  const response = await fetch('/api/templates');
  const data = await response.json();
  if (!response.ok) {
    return;
  }
  const templates = data.templates ?? [];
  for (const template of templates) {
    const option = document.createElement('option');
    option.value = template._id;
    option.textContent = template.name;
    scriptTemplateSelect.appendChild(option);
  }
}

async function generateScriptFromSelections({ switchToScriptTab = false } = {}) {
  setLoading(true);
  setStatus('Generating script...');
  setStatusSpinner(true);
  try {
    const model = scriptModel.value.trim() || scriptModelPresets.value;
    if (!model) {
      setStatus('Please select a model.', true);
      return;
    }
    const response = await fetch('/api/script/selections');
    const selectionData = await response.json();
    if (!response.ok) {
      setStatus(selectionData?.error || 'Failed to load selection.', true);
      return;
    }
    const selections = selectionData.selections ?? [];
    const tweetIds = selections.map((item) => item.tweetId);
    if (tweetIds.length === 0) {
      setStatus('No tweets selected for script.', true);
      return;
    }
    const prompt = scriptPrompt.value.trim();
    if (!prompt) {
      setStatus('Please provide a prompt.', true);
      return;
    }
    const templateId = scriptTemplateSelect.value || undefined;
    await requestJson('/api/script/generate', { model, prompt, tweetIds, templateId });
    if (switchToScriptTab) {
      setActiveTab('script');
    }
    await loadScriptHistory();
  } catch (error) {
    setStatus(error.message || 'Script generation failed.', true);
  } finally {
    setStatusSpinner(false);
    setLoading(false);
  }
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

tabAnalyze.addEventListener('click', () => setActiveTab('analyze'));
tabHistory.addEventListener('click', () => setActiveTab('history'));
tabHandles.addEventListener('click', async () => {
  setActiveTab('handles');
  try {
    await loadHandlesGrid();
  } catch (error) {
    handlesGrid.innerHTML = '<div class="muted">Failed to load handles.</div>';
  }
});
tabBird.addEventListener('click', () => setActiveTab('bird'));
tabForYou.addEventListener('click', () => setActiveTab('foryou'));
tabScript.addEventListener('click', async () => {
  setActiveTab('script');
  await loadScriptSelections();
  await loadScriptHistory();
  await loadTemplates();
});

historyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  historyPage = 1;
  historyLastFilters = getHistoryFilters();
  try {
    await fetchHistory(historyPage);
  } catch (error) {
    setHistoryStatus(error.message || 'History search failed.', true);
  }
});

document.getElementById('history-reset').addEventListener('click', () => {
  historyStart.value = '';
  historyEnd.value = '';
  historyHandle.value = '';
  historyText.value = '';
  historyMinLikes.value = 0;
  historyMinRetweets.value = 0;
  historyMinReplies.value = 0;
  historyMinEngagement.value = 0;
  historyPageSize.value = 20;
  historyLastFilters = null;
  clearHistoryResults();
  setHistoryStatus('Ready.');
  historyPageInfo.textContent = 'Page 1';
});

historyPrev.addEventListener('click', async () => {
  if (historyPage <= 1) {
    return;
  }
  try {
    await fetchHistory(historyPage - 1);
  } catch (error) {
    setHistoryStatus(error.message || 'History pagination failed.', true);
  }
});

historyNext.addEventListener('click', async () => {
  if (historyTotalPages && historyPage >= historyTotalPages) {
    return;
  }
  try {
    await fetchHistory(historyPage + 1);
  } catch (error) {
    setHistoryStatus(error.message || 'History pagination failed.', true);
  }
});

handlesHistoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  handlesHistoryPage = 1;
  handlesHistoryFilters = getHandlesHistoryFilters();
  try {
    await fetchHandlesHistory(handlesHistoryPage);
  } catch (error) {
    setHandlesHistoryStatus(error.message || 'History search failed.', true);
  }
});

document.getElementById('handles-history-reset').addEventListener('click', () => {
  handlesHistoryStart.value = '';
  handlesHistoryEnd.value = '';
  handlesHistoryHandle.value = '';
  handlesHistoryText.value = '';
  handlesHistoryMinLikes.value = 0;
  handlesHistoryMinRetweets.value = 0;
  handlesHistoryMinReplies.value = 0;
  handlesHistoryMinEngagement.value = 0;
  handlesHistoryPageSize.value = 20;
  handlesHistoryFilters = null;
  clearHandlesHistoryResults();
  setHandlesHistoryStatus('Ready.');
  handlesHistoryPageInfo.textContent = 'Page 1';
});

handlesHistoryPrev.addEventListener('click', async () => {
  if (handlesHistoryPage <= 1) {
    return;
  }
  try {
    await fetchHandlesHistory(handlesHistoryPage - 1);
  } catch (error) {
    setHandlesHistoryStatus(error.message || 'History pagination failed.', true);
  }
});

handlesHistoryNext.addEventListener('click', async () => {
  if (handlesHistoryTotalPages && handlesHistoryPage >= handlesHistoryTotalPages) {
    return;
  }
  try {
    await fetchHandlesHistory(handlesHistoryPage + 1);
  } catch (error) {
    setHandlesHistoryStatus(error.message || 'History pagination failed.', true);
  }
});

scriptModelPresets.addEventListener('change', () => {
  if (scriptModelPresets.value) {
    scriptModel.value = scriptModelPresets.value;
  }
});

scriptTemplateSelect.addEventListener('change', async () => {
  const id = scriptTemplateSelect.value;
  if (!id) {
    return;
  }
  const response = await fetch('/api/templates');
  const data = await response.json();
  const templates = data.templates ?? [];
  const template = templates.find((item) => item._id === id);
  if (template) {
    scriptTemplateName.value = template.name;
    scriptTemplateContent.value = template.content;
  }
});

scriptSaveTemplate.addEventListener('click', async () => {
  const name = scriptTemplateName.value.trim();
  const content = scriptTemplateContent.value.trim();
  if (!name || !content) {
    setStatus('Template name and content required.', true);
    return;
  }
  await requestJson('/api/templates', { name, content });
  await loadTemplates();
});

scriptForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await generateScriptFromSelections({ switchToScriptTab: true });
});

scriptClear.addEventListener('click', async () => {
  await requestJson('/api/script/selections/clear', {});
  await loadScriptSelections();
});

updateAnalyzeMode();
setActiveTab('analyze');