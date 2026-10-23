#!/usr/bin/env python3
"""
StudySpaceFinder — Research Data Analysis Script
================================================
Run this after your pilot study to generate all the stats
you need for your research report.

Requirements:
    pip install supabase pandas scipy matplotlib seaborn

Usage:
    cd analysis && python analyse.py
"""

import os
import json
from datetime import datetime, timezone

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from scipy import stats
from supabase import create_client, Client

# ── Supabase connection ────────────────────────────────────────
# Credentials come from environment variables only. The service_role key
# bypasses Row Level Security, so it must never be committed to the repo.
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        "Missing credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY "
        "(see .env.example) before running this script."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Helper ─────────────────────────────────────────────────────
def fetch(table: str, columns: str = "*") -> pd.DataFrame:
    res = supabase.table(table).select(columns).execute()
    return pd.DataFrame(res.data)

# ──────────────────────────────────────────────────────────────
# 1. SEARCH TIME ANALYSIS  (Research Question 1)
#    How does the app affect average time spent searching?
# ──────────────────────────────────────────────────────────────
def analyse_search_time():
    print("\n" + "="*60)
    print("RQ1 — SEARCH TIME ANALYSIS")
    print("="*60)

    sessions = fetch("search_sessions")
    if sessions.empty:
        print("No session data found."); return

    sessions["started_at"]  = pd.to_datetime(sessions["started_at"])
    sessions["resolved_at"] = pd.to_datetime(sessions["resolved_at"])
    resolved = sessions.dropna(subset=["search_duration_seconds"]).copy()

    if resolved.empty:
        print("No resolved sessions yet."); return

    durations = resolved["search_duration_seconds"]
    print(f"\nTotal resolved sessions:  {len(resolved)}")
    print(f"Mean search time:         {durations.mean():.1f}s  ({durations.mean()/60:.1f} min)")
    print(f"Median search time:       {durations.median():.1f}s")
    print(f"Std deviation:            {durations.std():.1f}s")
    print(f"Min / Max:                {durations.min()}s / {durations.max()}s")

    # NOTE: If you have pre-app baseline data (e.g. from a survey asking
    # "how long did you usually spend searching BEFORE this app?"), add it
    # here and run a paired t-test:
    #   t_stat, p_value = stats.ttest_rel(before_times, after_times)
    #   print(f"\nPaired t-test: t={t_stat:.3f}, p={p_value:.4f}")
    #   if p_value < 0.05: print("→ Statistically significant reduction in search time!")

    # Plot distribution
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(durations, bins=15, color="#3B82F6", edgecolor="#0A0F1E", alpha=0.85)
    ax.axvline(durations.mean(), color="#10B981", linestyle="--", linewidth=2, label=f"Mean: {durations.mean():.1f}s")
    ax.set_xlabel("Search Duration (seconds)")
    ax.set_ylabel("Frequency")
    ax.set_title("Distribution of Search Times (RQ1)")
    ax.legend()
    plt.tight_layout()
    plt.savefig("output/search_time_distribution.png", dpi=150)
    print("\nSaved: output/search_time_distribution.png")
    plt.close()

    return resolved


# ──────────────────────────────────────────────────────────────
# 2. ACCURACY ANALYSIS  (Research Question 2)
#    How accurate is crowdsourced data vs. physical headcounts?
# ──────────────────────────────────────────────────────────────
def analyse_accuracy():
    print("\n" + "="*60)
    print("RQ2 — CROWDSOURCING ACCURACY ANALYSIS")
    print("="*60)

    headcounts = fetch("headcounts")
    check_ins  = fetch("check_ins")
    spaces     = fetch("spaces")

    if headcounts.empty or check_ins.empty:
        print("Insufficient data for accuracy analysis."); return

    headcounts["created_at"] = pd.to_datetime(headcounts["created_at"], utc=True)
    check_ins["created_at"]  = pd.to_datetime(check_ins["created_at"],  utc=True)

    rows = []
    for _, hc in headcounts.iterrows():
        space_row = spaces[spaces["id"] == hc["space_id"]]
        if space_row.empty: continue
        capacity = space_row.iloc[0]["capacity"]

        # Ground truth: occupied if headcount > 50% capacity
        ground_truth = "occupied" if hc["count"] > capacity * 0.5 else "free"

        # Closest crowdsourced report within ±15 minutes
        window = check_ins[
            (check_ins["space_id"] == hc["space_id"]) &
            (abs((check_ins["created_at"] - hc["created_at"]).dt.total_seconds()) <= 900)
        ]

        if window.empty:
            crowdsourced = None
        else:
            # Use the most recent report in the window
            crowdsourced = window.sort_values("created_at").iloc[-1]["status"]

        rows.append({
            "space_id":       hc["space_id"],
            "headcount":      hc["count"],
            "capacity":       capacity,
            "occupancy_pct":  round(hc["count"] / capacity * 100, 1),
            "ground_truth":   ground_truth,
            "crowdsourced":   crowdsourced,
            "has_report":     crowdsourced is not None,
        })

    df = pd.DataFrame(rows)
    matched = df.dropna(subset=["crowdsourced"])

    print(f"\nTotal headcount observations: {len(df)}")
    print(f"Matched with crowdsourced report: {len(matched)} ({len(matched)/len(df)*100:.1f}%)")

    if matched.empty:
        print("No matched records — collect more headcount data close to app reports."); return

    # Confusion matrix
    tp = len(matched[(matched["ground_truth"] == "occupied") & (matched["crowdsourced"] == "occupied")])
    tn = len(matched[(matched["ground_truth"] == "free")     & (matched["crowdsourced"] == "free")])
    fp = len(matched[(matched["ground_truth"] == "free")     & (matched["crowdsourced"] == "occupied")])
    fn = len(matched[(matched["ground_truth"] == "occupied") & (matched["crowdsourced"] == "free")])

    total     = len(matched)
    accuracy  = (tp + tn) / total * 100
    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    recall    = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    fp_rate   = fp / (fp + tn) * 100 if (fp + tn) > 0 else 0

    print(f"\n--- Confusion Matrix ---")
    print(f"True Positives (correctly reported occupied): {tp}")
    print(f"True Negatives (correctly reported free):     {tn}")
    print(f"False Positives (reported occupied, was free):{fp}")
    print(f"False Negatives (reported free, was occupied):{fn}")
    print(f"\n--- Accuracy Metrics ---")
    print(f"Overall Accuracy:  {accuracy:.1f}%")
    print(f"Precision:         {precision:.1f}%")
    print(f"Recall:            {recall:.1f}%")
    print(f"False Positive Rate: {fp_rate:.1f}%")

    # Plot
    cm = [[tp, fn], [fp, tn]]
    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Occupied", "Free"],
                yticklabels=["Occupied", "Free"], ax=ax)
    ax.set_xlabel("Crowdsourced Report")
    ax.set_ylabel("Ground Truth (Headcount)")
    ax.set_title(f"Accuracy Heatmap  (overall: {accuracy:.1f}%)")
    plt.tight_layout()
    plt.savefig("output/accuracy_heatmap.png", dpi=150)
    print("\nSaved: output/accuracy_heatmap.png")
    plt.close()

    return df


# ──────────────────────────────────────────────────────────────
# 3. TAM SURVEY ANALYSIS
# ──────────────────────────────────────────────────────────────
def analyse_survey():
    print("\n" + "="*60)
    print("TAM SURVEY ANALYSIS")
    print("="*60)

    df = fetch("survey_responses")
    if df.empty:
        print("No survey responses yet."); return

    cols = ["perceived_useful", "perceived_ease", "trust_in_data", "would_continue"]
    labels = {
        "perceived_useful": "Perceived Usefulness (PU)",
        "perceived_ease":   "Perceived Ease of Use (PEOU)",
        "trust_in_data":    "Trust in Data",
        "would_continue":   "Continuance Intention",
    }

    print(f"\nTotal responses: {len(df)}\n")
    for col in cols:
        if col in df.columns:
            s = df[col].dropna()
            print(f"{labels[col]}")
            print(f"  Mean: {s.mean():.2f}  |  Median: {s.median():.1f}  |  Std: {s.std():.2f}")

    # Bar chart
    means = [df[c].mean() for c in cols if c in df.columns]
    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.bar([labels[c] for c in cols if c in df.columns], means,
                  color=["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"])
    ax.set_ylim(1, 5)
    ax.axhline(3, color="grey", linestyle="--", linewidth=1, label="Neutral (3)")
    ax.set_ylabel("Mean Score (1–5)")
    ax.set_title("TAM Survey Results")
    ax.legend()
    plt.xticks(rotation=15, ha="right")
    plt.tight_layout()
    plt.savefig("output/tam_survey_results.png", dpi=150)
    print("\nSaved: output/tam_survey_results.png")
    plt.close()

    # Open feedback
    if "open_feedback" in df.columns:
        feedback = df["open_feedback"].dropna().tolist()
        print(f"\n--- Open Feedback Responses ({len(feedback)}) ---")
        for i, f in enumerate(feedback, 1):
            print(f"  [{i}] {f}")


# ──────────────────────────────────────────────────────────────
# 4. USAGE OVER TIME
# ──────────────────────────────────────────────────────────────
def analyse_usage():
    print("\n" + "="*60)
    print("USAGE OVER TIME")
    print("="*60)

    check_ins = fetch("check_ins")
    if check_ins.empty: return

    check_ins["created_at"] = pd.to_datetime(check_ins["created_at"])
    check_ins["date"]       = check_ins["created_at"].dt.date

    daily = check_ins.groupby("date").size().reset_index(name="count")

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(daily["date"], daily["count"], color="#3B82F6", linewidth=2, marker="o", markersize=4)
    ax.fill_between(daily["date"], daily["count"], alpha=0.1, color="#3B82F6")
    ax.set_xlabel("Date")
    ax.set_ylabel("Check-ins per day")
    ax.set_title("Daily App Usage (Check-ins)")
    plt.tight_layout()
    plt.savefig("output/usage_over_time.png", dpi=150)
    print("Saved: output/usage_over_time.png")
    plt.close()


# ──────────────────────────────────────────────────────────────
# 5. EXPORT CSV for R / SPSS
# ──────────────────────────────────────────────────────────────
def export_csv():
    print("\n" + "="*60)
    print("EXPORTING RAW DATA TO CSV")
    print("="*60)

    tables = ["check_ins", "search_sessions", "headcounts", "survey_responses"]
    for t in tables:
        df = fetch(t)
        path = f"output/{t}.csv"
        df.to_csv(path, index=False)
        print(f"Exported {len(df)} rows → {path}")


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    print("StudySpaceFinder — Research Analysis")
    print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    analyse_search_time()
    analyse_accuracy()
    analyse_survey()
    analyse_usage()
    export_csv()

    print("\n✅ Analysis complete. Check the output/ folder.")
