# AI Failure Case Collection Pipeline

## Goal
Collect real-world "AI wrote it, but it failed" cases and convert them into lesson-ready assets.

## Output
- Source backlog: `docs/templates/ai-failure-cases-template.csv` (or copied to a working file)
- Weekly triage list: 10 candidate cases
- Lesson-ready cases: at least 3 per week

## Case Definition
A case is valid only when all 3 are true:
1. Reproducible: there is clear input/condition to reproduce failure.
2. Explainable: root cause can be described in 1-3 sentences.
3. Teachable: can be turned into a short exercise with a concrete fix.

## Source Channels (Priority)
1. Internal user logs/errors (highest)
2. GitHub issues/PRs mentioning AI-generated code
3. Stack Overflow / Reddit reports
4. Public benchmark failures (SWE-bench style)

## Pipeline Stages
1. Ingest
- Add raw case into CSV with minimal fields:
  - `source_type`, `source_url`, `language`, `domain`, `symptom`, `raw_snippet`

2. Normalize
- Fill these fields:
  - `repro_steps`, `expected_behavior`, `actual_behavior`, `root_cause`
- Remove sensitive data from snippet/logs.

3. Score
- Score each case from 1-5:
  - `impact_score` (how damaging in real work)
  - `frequency_score` (how often it appears)
  - `clarity_score` (how easy to teach)
- Compute priority: `impact * 0.5 + frequency * 0.3 + clarity * 0.2`

4. Triage
- Keep top 10 by priority each week.
- Mark status:
  - `new`, `triaged`, `lesson_candidate`, `lesson_published`, `rejected`

5. Lesson Mapping
- Map each candidate into one of tracks:
  - `verification`, `debugging`, `automation_literacy`
- Define lesson format:
  - bug prompt -> reproduction -> diagnosis -> minimal patch -> regression check

6. QA Gate
- Must pass:
  - Reproduction works locally
  - Fix solves failure and does not break baseline check
  - Explanation is under 180 words for step-level content

## Weekly Operating Rhythm
1. Monday: ingest + normalize (30-50 raw cases)
2. Tuesday: score + triage (top 10)
3. Wednesday-Thursday: convert top 3 into lesson drafts
4. Friday: publish 1-3 validated cases and review metrics

## Ownership
- Collector: gathers raw cases and fills ingest fields
- Reviewer: validates reproducibility + root cause
- Lesson editor: converts into course JSON steps

## Metrics
- `new_cases_per_week`
- `triaged_cases_per_week`
- `published_lessons_per_week`
- `rejection_rate`
- `time_to_publish` (ingest -> lesson_published)

## Rejection Rules
Reject if any applies:
1. Not reproducible
2. Root cause is unclear after 20 minutes
3. Case is too niche and not generalizable
4. Legal/privacy risk in source content

## First Week Bootstrap
1. Create working backlog file from template.
2. Add 20 cases (target mix: JS 8, Java 6, Python 6).
3. Publish 2 pilot lessons from highest-priority cases.
