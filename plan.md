# Build Instructions: One Piece TCG Leader Win-Rate Tool

Build a small web app that recommends whether the player should **go first or go second** in a One Piece Trading Card Game matchup, using matchup statistics from the Card Kaizoku API.

## Goal

The user will manually select:

1. **Their leader**
2. **Their opponent's leader**

The app will then look up the corresponding matchup statistics from the API and recommend whether to **GO FIRST** or **GO SECOND** based on which option has the higher win rate.

There is **no automatic detection** of the leader being played. Both leaders are selected manually through the UI.

---

## Data Source

The app should fetch this JSON endpoint:

`https://cdn.cardkaizoku.com/stats/stats_op17_lw_20260830.json?v=20260830`

The endpoint is publicly accessible and returns JSON containing leader statistics.

The JSON is organized around the leader whose statistics are being viewed.

Conceptually, the structure is:

```json
[
  {
    "leader": "OP13-004",
    "leaderKey": "OP13-004",
    "leaderName": "Sabo",
    "matchups": [
      {
        "opponent": "OP17-099",
        "first_win_rate": 0.503,
        "second_win_rate": 0.635
      }
    ]
  }
]
```

The exact JSON should be treated as the source of truth rather than hardcoding the example structure beyond the fields actually present in the response.

---

## How the Data Lookup Works

The top-level leader object represents **the player's selected leader**.

For example:

```text
leaderKey = OP13-004
leaderName = Sabo
```

means the object contains Sabo's matchup statistics.

Within that object's `matchups` array, find the selected opponent.

Conceptually:

```ts
const myLeader = stats.find(
  leader => leader.leaderKey === selectedMyLeaderId
);

const matchup = myLeader.matchups.find(
  matchup => matchup.opponent === selectedOpponentId
);
```

Then use:

```ts
matchup.first_win_rate
matchup.second_win_rate
```

to determine the recommendation.

---

## Recommendation Logic

Compare the two win rates.

Example:

```text
First win rate: 50.3%
Second win rate: 63.5%
```

Since second is higher:

```text
GO SECOND
```

If first is higher:

```text
GO FIRST
```

If they are exactly equal, display something appropriate such as:

```text
EVEN
```

or:

```text
NO CLEAR ADVANTAGE
```

Do not arbitrarily favor first or second when the rates are equal.

---

## User Interface

Create a simple, polished UI.

Primary controls:

### Your Leader

A searchable/selectable dropdown containing all available leaders.

Display the human-readable `leaderName`, not the card ID.

Internally store the corresponding leader/card ID.

Example:

```text
Your Leader
┌─────────────────────────┐
│ Sabo                 ▼  │
└─────────────────────────┘
```

### Opponent Leader

A second searchable/selectable dropdown.

Example:

```text
Opponent Leader
┌─────────────────────────┐
│ Enel                 ▼  │
└─────────────────────────┘
```

Then provide a button:

```text
[ ANALYZE ]
```

---

## Results

After both leaders are selected, show:

```text
GO SECOND

First: 50.3%
Second: 63.5%
```

Make the recommendation visually prominent.

Also show the underlying statistics so the user can understand why the recommendation was made.

If useful, display the matchup as:

```text
Sabo vs Enel
```

---

## API Fetching

The app should fetch the JSON dynamically rather than embedding the dataset into the application.

Use browser `fetch()`.

Example:

```ts
const response = await fetch(
  "https://cdn.cardkaizoku.com/stats/stats_op17_lw_20260830.json?v=20260830"
);

if (!response.ok) {
  throw new Error(`Failed to fetch stats: ${response.status}`);
}

const stats = await response.json();
```

The application must handle:

* Network failures
* Non-200 responses
* Invalid/unexpected JSON
* A leader not being found
* A matchup not being found

Do not silently return incorrect statistics.

---

## Important CORS Requirement

Before assuming the frontend can fetch the API, test the endpoint with a browser-side request.

The relevant test is:

```js
fetch("https://cdn.cardkaizoku.com/stats/stats_op17_lw_20260830.json?v=20260830")
  .then(response => {
    console.log("Status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Leaders:", data.length);
    console.log(data[0]);
  })
  .catch(console.error);
```

The fact that the URL returns `200 OK` in DevTools proves the browser can reach the endpoint, but the application must also be able to make a cross-origin `fetch()` request.

If CORS prevents the browser from reading the response, do not attempt to work around it with insecure client-side tricks. Instead, implement an appropriate backend/server-side proxy if the chosen architecture allows it.

---

## Technology

Prefer:

* React
* TypeScript
* Vite
* Modern CSS

Keep the architecture simple.

There is no need for a database or authentication.

The initial application can be entirely client-side if CORS permits it.

Suggested structure:

```text
src/
  components/
    LeaderSelect.tsx
    MatchupResult.tsx
  services/
    statsApi.ts
  types/
    stats.ts
  App.tsx
  main.tsx
```

The exact structure can differ if a simpler organization is preferable.

---

## Type Safety

Define TypeScript types for the API response.

For example, conceptually:

```ts
interface LeaderStats {
  leader: string;
  leaderKey: string;
  leaderName: string;
  matchups: Matchup[];
}

interface Matchup {
  opponent: string;
  first_win_rate: number;
  second_win_rate: number;
}
```

However, inspect the actual API response and adjust the types to match it exactly.

Do not assume fields exist merely because they appear in the example.

---

## Leader Selection

Populate both dropdowns from the API data.

Do not maintain a manually hardcoded list of leaders unless the API genuinely lacks the necessary information.

For the player's leader dropdown:

```text
leaderName → leaderKey
```

For the opponent dropdown, use the appropriate opponent IDs/names from the actual dataset.

The UI should remain human-friendly while the application works internally with IDs.

---

## State

At minimum, maintain state for:

```ts
selectedMyLeader
selectedOpponent
result
loading
error
```

The initial API fetch should populate the available leaders.

The result should be recalculated whenever the user analyzes a matchup.

---

## Loading/Error States

Show a loading state while the API is being fetched.

Example:

```text
Loading matchup data...
```

If the API cannot be reached:

```text
Unable to load matchup data.
Please try again.
```

If a matchup does not exist:

```text
No matchup data available for this pairing.
```

Do not display `0%` or another misleading value when data is missing.

---

## Important Clarification

Do **not** implement automatic detection of the player's leader or opponent's leader.

The user explicitly wants this to be **manual**.

The intended workflow is:

```text
Fetch API
     ↓
Populate leader selectors
     ↓
User selects their leader
     ↓
User selects opponent's leader
     ↓
Find selected leader's statistics
     ↓
Find selected opponent within matchups
     ↓
Compare first_win_rate vs second_win_rate
     ↓
Display GO FIRST / GO SECOND
```

---

## Example

Suppose the user selects:

```text
Your Leader: Sabo
Opponent: OP17-099
```

and the API contains:

```json
{
  "leaderKey": "OP13-004",
  "leaderName": "Sabo",
  "matchups": [
    {
      "opponent": "OP17-099",
      "first_win_rate": 0.503,
      "second_win_rate": 0.635
    }
  ]
}
```

The application should display approximately:

```text
Sabo vs OP17-099

GO SECOND

First
50.3%

Second
63.5%
```

---

## UX Expectations

Make the application feel like a useful tournament tool rather than a generic demo.

Prioritize:

* Fast interaction
* Large, obvious recommendation
* Easy leader searching
* Minimal clicks
* Clear percentages
* Good mobile usability
* Clean dark/light styling if appropriate
* No unnecessary pages or features

The most important interaction should be possible in a few seconds:

```text
Select leader → Select opponent → Analyze → See decision
```

---

## Do Not Overengineer

Do not add:

* Authentication
* User accounts
* A database
* Automatic game/simulator integration
* Scraping of the official One Piece simulator
* Automatic leader detection
* Patreon authentication
* Unnecessary backend infrastructure

unless a technical limitation such as CORS makes a backend necessary.

The API already provides the statistical data needed for the core feature.

---

## Deliverable

Produce a complete runnable application.

Include:

1. All source code
2. TypeScript types
3. API fetching logic
4. Leader selection UI
5. Opponent selection UI
6. Matchup lookup
7. First/second calculation
8. Loading/error/empty states
9. Instructions for installing dependencies and running locally
10. A brief explanation of how the API data flows through the application

Before finalizing, verify that the implementation correctly handles the actual JSON returned by the API rather than relying solely on the example object above.
