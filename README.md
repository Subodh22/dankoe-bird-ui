# Bird UI (local)

Simple local web UI for Bird search and user timelines.

## Prerequisites
- Node.js 18+ (npm included)
- Logged in to X in a supported browser (Chrome or Firefox) on this machine

Bird reads cookies from your browser profile. If you use a different browser or profile,
set the cookie source explicitly.

## Setup
```powershell
cd "C:\Users\Subodh Maharjan\Desktop\dankoe\bird-ui"
npm install
```

## Run
```powershell
cd "C:\Users\Subodh Maharjan\Desktop\dankoe\bird-ui"
npm run dev
```

Open `http://localhost:3000` in your browser.

## Fetch then filter
Use the **Analyze** dropdown:
1. Select **Fetch** to load handles into the server cache.
2. Switch to **Outliers** or **Matrix** and choose the time window (24h/7d/30d).

Handles and tweets are stored in Convex.
Use **Save Handles** to persist your list for the daily cron job.
If the handles box is empty, Outliers/Matrix will use saved handles from Convex.

## History tab
Use **History** to browse saved tweets with advanced filters:
- Time range (start/end)
- Handle + text contains
- Minimum likes/retweets/replies/engagement
Results are paginated (default 20 per page).

## Handles tab
Use **Handles** to see a grid of saved handles with basic stats. Click **View History** to
load that handle’s past tweets, then refine with filters and pagination.

## Script tab
Use **Script** to generate a YouTube script from selected tweets:
1. In **Handles**, click **Add** on tweets you want to include.
2. Open **Script**, pick an OpenRouter model, paste your prompt, and click **Generate**.
3. Generated scripts are saved with history.

## Outlier tweets
After fetching, the server computes engagement (`likes + retweets + replies`) and
ranks tweets by outlier score (engagement vs the author’s median).

Toggle “Show outlier score” to hide or display the outlier column in the table.

## Matrix tweets
After fetching, Matrix returns the highest-engagement tweets across cached handles.
It uses the same engagement formula (likes + retweets + replies).

## Optional: use .env tokens
Create `C:\Users\Subodh Maharjan\Desktop\dankoe\bird-ui\.env`:

```
CONVEX_URL=your_convex_deployment_url
OPENROUTER_API_KEY=your_openrouter_key
AUTH_TOKEN=your_auth_token_here
CT0=your_ct0_here
```

The server loads `.env` automatically at startup.

## Convex setup
1. From `C:\Users\Subodh Maharjan\Desktop\dankoe\bird-ui`, run:
   - `npx convex dev`
2. Follow the prompts to create a new Convex project.
3. Copy the deployment URL into `CONVEX_URL`.

## Vercel deployment + cron
1. Deploy the `bird-ui` folder to Vercel.
2. Add env vars in Vercel:
   - `CONVEX_URL`
   - `AUTH_TOKEN` and `CT0` (or browser cookies if running locally)
   - `CRON_SECRET` (optional but recommended)
3. Vercel cron is configured in `vercel.json`:
   - Daily at 6:00 AM AEST (20:00 UTC).
4. If `CRON_SECRET` is set, send it in the header:
   - `x-cron-secret: <your-secret>`

## Optional: choose cookie sources
By default, the server tries Chrome, then Firefox. You can override with:

```powershell
$env:BIRD_COOKIE_SOURCE="chrome,firefox"
npm run dev
```

If cookies are not found, make sure you are logged in to X in the selected browser.
