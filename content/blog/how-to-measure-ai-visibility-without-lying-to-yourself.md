---
title: "How to Measure AI Visibility Without Lying to Yourself"
slug: "how-to-measure-ai-visibility-without-lying-to-yourself"
description: "One ChatGPT screenshot is not a measurement system. How to build a repeatable AI visibility tracking practice: prompt sets, engines, logging, and turning results into fixes."
date: "2026-06-07"
category: "Training"
contentType: "Training"
author: "Matt Vincent Walker"
readTime: "11 min read"
featured: false
tags:
  - AI Visibility
  - Measurement
  - AEO
  - GEO
  - Tracking
  - Training
---

Someone on your team asks ChatGPT "who's the best plumber in town," screenshots the answer, and a conclusion gets drawn. Either celebration or panic. Both are usually wrong.

## Short answer

A single prompt on a single engine on a single day tells you almost nothing — AI answers vary by phrasing, engine, location wording, and plain run-to-run randomness. Real measurement means: a fixed set of buyer-language prompts, run across every engine that matters (ChatGPT, Perplexity, Gemini, Google AI Overviews, Maps), on a schedule, with results logged the same way every time — mention, position, sentiment, competitors, and sources. Then the numbers become trendlines, the trendlines expose gaps, and the gaps become a work order. Measurement that doesn't end in a fix is a dashboard hobby.

## Why single-prompt testing lies to you

Four reasons the screenshot test fails:

1. **Variance.** The same question, asked twice, can produce different shortlists. Engines sample; retrieval shifts; answers move. One run is an anecdote.
2. **Phrasing sensitivity.** "Best plumber in Red Oak" and "who should I call for a slab leak in Red Oak" retrieve differently. Buyers use both. Testing one phrasing tests one door into the building.
3. **Engine divergence.** In our client testing it is completely normal to see a business named in 70%+ of runs on one engine and near-zero on another — same company, same week. Each engine has its own retrieval habits and source diet. A ChatGPT result says nothing about Gemini.
4. **The wrong question.** "Does AI know us?" isn't the business question. The business question is: *when a buyer asks the questions that precede a phone call, are we in the answer?*

## The vocabulary: mention, citation, recommendation, source

These get blurred constantly, and the blur produces bad decisions:

- **Mention** — your business name appears anywhere in the answer. Weakest signal. "X-Act Plumbing also operates in the area" is a mention.
- **Recommendation** — the answer presents you as a choice, ideally ranked: "Top options include…" Position matters; being named first is different from being named fifth.
- **Citation** — the engine links or attributes a source. You can be *cited* (your site is a source) without being *recommended*, and vice versa.
- **Source** — the third-party pages the engine drew from: directories, review sites, local press. Sources explain *why* answers say what they say — and they're where many fixes live. More on that dynamic in [the source ecosystem](/research/the-source-ecosystem-third-party-mentions-ai-recommendations).

Log all four. A business that's recommended but never cited has a fragile position built on other people's pages. A business that's cited but never recommended has an authority problem, not an access problem.

## Build the prompt set

Ten to twenty prompts, written the way buyers actually talk, covering three intent bands:

- **Decision prompts** (highest value): "best [trade] in [city]", "who should I call for [emergency] in [city]", "[trade] near me reviews"
- **Problem prompts:** "water heater making popping noise", "how much does drain cleaning cost in [city]"
- **Verification prompts:** "[business name] reviews", "is [business name] legit"

Rules: real language, not keyword fragments. Include every town in the service area, not just the headquarters city — answers change with the place name. Freeze the set. You're building a longitudinal instrument; if the prompts drift every month, the trendline is fiction.

## Run it across engines, on a schedule

Minimum viable engine coverage for a local business: **ChatGPT, Perplexity, Gemini, Google AI Overviews, and Google Maps.** They disagree — that disagreement is data, not noise.

Cadence: every two weeks is enough. Engines don't reshuffle daily, and a fortnightly rhythm is sustainable enough to still be running six months from now, which is the entire point.

Two honesty rules:

- **"No AI Overview appeared" is a result.** Log it. If Google shows no overview for a query, you're not losing that surface — nobody's winning it.
- **Absence is a data point, not a failure of the test.** The temptation is to re-run until a better answer appears. That's lying to yourself with extra steps.

## Log it like you mean it

Every run, same fields: date, prompt, engine, mentioned (y/n), position, sentiment, competitors named, sources cited. A spreadsheet works. A database is better. What doesn't work is memory and screenshots.

From that log, four numbers matter:

- **Mention rate** — % of prompt×engine runs where you're named. Your headline visibility number.
- **Share of voice** — your mentions vs. competitors' across the same runs. You can improve while losing ground; this catches it.
- **Per-engine rates** — because the fix for a Gemini gap (often entity/GBP-shaped) is different from a Perplexity gap (often citation/source-shaped).
- **Deltas** — everything above, versus last period. The trendline is the product.

## Handling inconsistency

Inconsistent outputs are the norm, so design for them instead of being surprised: run the full set rather than cherry-picking, judge every answer by the same rubric (was the business explicitly named — not implied, not adjacent), and treat a flip from ✗ to ✓ on a specific prompt×engine pair as a **win event** worth recording. Those flips, accumulated, are the honest success metric — far more honest than any single day's snapshot.

## Measurement must end in a work order

The log is only useful if each gap maps to an action:

| What you observe | What it usually means | The fix lane |
|---|---|---|
| Low mentions everywhere | Entity unclear or content missing | Service pages, entity cleanup |
| Strong on ChatGPT, dead on Maps | Local signals weak | GBP, reviews, citations |
| Competitors cited from directories you're absent from | Source gap | Get listed where engines actually look |
| Recommended but sentiment flat | Proof gap | Review content, case evidence |
| Invisible for one town, visible in another | Location gap | Town-specific pages and coverage |

If a month of measurement hasn't changed what you're working on, you're not measuring — you're decorating. The methodology we run for clients (and [how to test whether AI recommends your business](/research/how-to-test-whether-ai-recommends-your-business) if you want the DIY version) exists to feed the fix list, not to produce prettier charts.

This is the field version. The complete methodology — scorecard, spreadsheet schema, variance rules, and the fix-routing table — is the [AI Search Measurement Playbook](/research/ai-search-measurement-playbook).

## Want the measurement done for you?

We run this exact system — fixed prompt sets, six engines, logged verdicts, trendlines, and a prioritized fix list — as the foundation of every engagement.

**[Book the Visibility Audit](/visibility-check)**

## Sources and further reading

- Google Search Central: AI features and your website — developers.google.com/search/docs/appearance/ai-features
- Google Business Profile: How to improve your local ranking — support.google.com/business/answer/7091
- Google Search Console documentation: Performance report (AI feature traffic reporting) — support.google.com/webmasters
