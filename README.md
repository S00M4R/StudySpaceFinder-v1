<div align="center">

<img src="assets/images/icon.png" alt="StudySpace logo" width="96" />

# StudySpace Finder

**Real-time, crowdsourced study-space availability for campus.**

A cross-platform mobile app and research instrument built to measure how live occupancy data changes the way students find a place to study.

![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_Realtime-3ECF8E?logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/Python-analysis-3776AB?logo=python&logoColor=white)

</div>

---

## Overview

Finding a free computer lab, library desk, or group room on a busy campus usually means walking from building to building. **StudySpace Finder** lets students report whether a space is *free* or *full* in two taps, and shows everyone else the latest status instantly.

The project is also a **3rd-year IT research study**:

> *"Evaluating the Impact of a Real-Time Mobile Application on Campus Study Space Utilisation"*

Alongside the student-facing app, it includes the instrumentation and analysis pipeline needed to answer the research questions: search-time tracking, ground-truth headcounts, a built-in Technology Acceptance Model (TAM) survey, and a Python script that turns the raw data into statistics and charts.

## Features

| | |
|---|---|
| **Live occupancy** | Check-ins propagate to every connected device through Supabase Realtime, with no pull-to-refresh needed. |
| **Browse, filter and search** | Filter by Labs, Library or Group Rooms, or search by space or building name. |
| **Interactive floor map** | Colour-coded rooms (green = free, red = full, grey = unknown) across multiple floors. Tap a room to open it. |
| **Two-tap reporting** | Mark a space as free or full from its detail screen. |
| **Spam prevention** | A 5-minute per-space cooldown, persisted on-device, discourages repeated or malicious reports. |
| **Search-time tracking** | A session timer starts when the user begins looking for a space and stops when they check in, measuring time-to-find (RQ1). |
| **Observer mode** | Researchers can record physical headcounts to serve as ground truth for accuracy analysis (RQ2). |
| **Built-in TAM survey** | A short Likert questionnaire covering usefulness, ease of use, trust in the data and continuance intention. |
| **Auth and profiles** | Email/password sign-in with faculty and year-level metadata, protected by Postgres Row Level Security. |

<!--
SCREENSHOTS - uncomment and add images to docs/screenshots/ once you have them.

<div align="center">
  <img src="docs/screenshots/home.png" width="220" alt="Space list" />
  <img src="docs/screenshots/map.png" width="220" alt="Floor map" />
  <img src="docs/screenshots/detail.png" width="220" alt="Space detail" />
</div>
-->

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | React Native 0.81, Expo SDK 54, [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| Language | TypeScript |
| Backend | [Supabase](https://supabase.com): PostgreSQL, Auth, Realtime, Row Level Security |
| Local storage | AsyncStorage (session persistence, cooldowns, active search session) |
| Graphics | `react-native-svg` |
| Builds | EAS Build |
| Analysis | Python: pandas, SciPy, matplotlib, seaborn |

## Project Structure

```
StudySpaceFinder/
├── app/                      # Expo Router routes (thin wrappers around screens)
│   ├── _layout.tsx           #   Auth gate + root stack
│   ├── (tabs)/               #   Spaces · Map · Profile tabs
│   ├── space/[id].tsx        #   Space detail route
│   └── survey.tsx            #   TAM survey route
├── src/
│   ├── screens/              # Home, SpaceDetail, BuildingMap, Profile, Survey, Auth
│   ├── components/           # Shared UI primitives and SpaceCard
│   ├── hooks/useSpaces.ts    # Data layer: spaces, check-ins, sessions, headcounts, survey
│   ├── lib/                  # Supabase client + types, AuthContext, theme
│   └── navigation/
├── sql/schema.sql            # Tables, views, RLS policies and seed data
├── analysis/
│   ├── analyse.py            # Research analysis and CSV export
│   └── output/               # Generated charts (raw CSVs are git-ignored)
├── app.json · eas.json       # Expo and EAS configuration
└── .env.example              # Required environment variables
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20.19.4 or later (required by React Native 0.81) and npm
- A free [Supabase](https://supabase.com) account
- The **Expo Go** app on your phone, or an Android/iOS emulator
- Python 3.9+ (only for the analysis script)

### 1. Clone and install

```bash
git clone https://github.com/S00M4R/StudySpaceFinder.git
cd StudySpaceFinder
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor**, paste the contents of [`sql/schema.sql`](sql/schema.sql) and click **Run**. This creates the tables, views, RLS policies and ten sample spaces.
3. Enable Realtime for check-ins by running this in the SQL Editor (or toggling `check_ins` under **Database → Replication**):
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;
   ```
4. Under **Project Settings → API**, copy your **Project URL** and **anon public** key.

> **Sign-up failing with a row-level-security error?** If *Confirm email* is enabled under **Authentication → Providers → Email**, the profile row can't be created during registration. Disable it for pilot testing.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the app variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

The anon key is designed to ship in the client and is protected by Row Level Security. **Never** put the `service_role` key in an `EXPO_PUBLIC_` variable or in any file that is committed.

### 4. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` (Android) / `i` (iOS) to launch an emulator. Restart the dev server after changing `.env`.

### Building with EAS

```bash
npm install -g eas-cli
eas build --profile preview --platform android
```

For EAS builds, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS environment variables, because your local `.env` is not uploaded.

## How It Works

**Check-ins.** A report inserts a row into `check_ins`. The `space_status` view exposes the *latest* report per space, and Realtime subscriptions in `useSpaces.ts` refresh every connected client when a new row arrives.

**Search sessions (RQ1).** When the Home screen opens, a row is created in `search_sessions`. When the user checks in to a space, the session is resolved and `search_duration_seconds` is written. The active session ID is held in AsyncStorage so it survives navigation between screens.

**Ground truth (RQ2).** Observers log a physical headcount from the Space Detail screen. The analysis script treats a space as *occupied* when the count exceeds 50% of its capacity, then compares it against the closest crowdsourced report within ±15 minutes.

### Data model

| Table / view | Purpose |
|---|---|
| `spaces` | Campus study spaces: name, type, building, floor, capacity |
| `profiles` | Faculty and year level, linked to `auth.users` |
| `check_ins` | Crowdsourced *free* / *occupied* reports |
| `headcounts` | Observer ground-truth counts |
| `search_sessions` | Time-to-find measurements |
| `survey_responses` | TAM questionnaire answers (1-5 Likert) |
| `space_status` *(view)* | Latest status per space, used by the app |
| `research_accuracy` *(view)* | Headcount vs. crowdsourced comparison |

### Customising the map

Room positions live in the `ROOM_DEFS` array in [`src/screens/BuildingMapScreen.tsx`](src/screens/BuildingMapScreen.tsx). Each room's `spaceName` must **exactly match** a `name` in the `spaces` table, and rooms without a match are shown as grey/unknown. Add or rename spaces in Supabase to match your campus.

## Research Analysis

After collecting data, export credentials for the analysis script and run it from the `analysis/` folder:

```bash
pip install supabase pandas scipy matplotlib seaborn

export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"   # Settings → API → service_role

cd analysis
python analyse.py
```

On Windows PowerShell, use `$env:SUPABASE_URL = "..."` instead of `export`.

The script prints summary statistics and writes the following to `analysis/output/`:

| Output | Research question |
|---|---|
| `search_time_distribution.png` | **RQ1**: distribution of time-to-find |
| `accuracy_heatmap.png` | **RQ2**: confusion matrix of crowdsourced vs. observed occupancy |
| `tam_survey_results.png` | TAM construct means |
| `usage_over_time.png` | Daily check-in volume |
| `*.csv` | Raw exports for R or SPSS |

Charts for RQ1 and RQ2 are only generated once enough resolved sessions and matched headcounts exist.

> ⚠️ The analysis script uses the **service_role** key, which bypasses Row Level Security. Run it only on your own machine and never commit the key.

## Research Design

| Element | Detail |
|---|---|
| **RQ1** | How does the app affect the average time students spend searching for a study space? |
| **RQ2** | How accurate is crowdsourced occupancy data compared with physical headcounts? |
| **Framework** | Technology Acceptance Model (Davis, 1989) |
| **Paradigm** | Mixed methods (positivism and interpretivism) |
| **Instruments** | Search-session timing, observer headcounts, TAM survey, open feedback |

## Ethics and Privacy

- No background GPS or continuous location tracking.
- Data is only captured on explicit user interaction.
- Raw logs are anonymised before analysis, and exported research data is excluded from version control.
- Participants can withdraw at any time and request deletion of their data.
- No academic incentives are tied to usage, to avoid coercion bias.

## Known Limitations

- Occupancy is a binary *free / full* signal, and accuracy depends on how many students choose to report.
- Statuses do not expire automatically, so a stale report remains until someone updates it.
- The floor map is a hand-defined layout rather than data-driven.
- Results from any single pilot are small-sample and not generalisable on their own.


