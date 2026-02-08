## Daily For You scrape (7:00 AM AEST)

This app exposes a cron endpoint that saves your X For You feed into Convex:

`POST /api/cron/foryou`

It requires the `x-cron-secret` header and uses your X cookies from `.env`.

### Required env vars

- `AUTH_TOKEN` and `CT0` (X session cookies)
- `CRON_SECRET` (any long random string)

### Windows Task Scheduler (recommended)

Create a daily task at **7:00 AM AEST** that runs:

```
powershell -NoProfile -Command "Invoke-WebRequest -Method POST -Headers @{ 'x-cron-secret' = 'YOUR_SECRET' } -Uri http://localhost:3000/api/cron/foryou"
```

If your app runs on another host/port, update the URL. You can also add `?count=50` to the URL to change the number of tweets.

### Notes

- The endpoint deduplicates by `tweetId` in Convex.
- Tweets are tagged with `sources: ['foryou']` and can be filtered in the History view.
