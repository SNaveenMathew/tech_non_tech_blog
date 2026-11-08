---
layout: post
date: 2026-11-08 06:00:00 -0500
description: "Regex validation, shared database connections, and prompt-based scoping gave a false sense of security. AST contracts, per-thread cursors, ContextVar scoping, and isolated circuit breakers make the house-hunting agent resilient under pressure."
image: /assets/previews/agent-resilience.webp
---

## Hardening the house-hunting agent: contracts, concurrency, and resilience

In my [last post on the house agent](https://snaveenmathew.github.io/tech_non_tech_blog/2026/10/02/From-catalog-to-canvas-and-artifacts-in-the-house-hunting-agent.html), I focused on the presentation layer: map choropleths, crime animations, and UI artifacts. The parts that produced answers were well designed. The boundaries around them relied on regular expressions, prompt conventions, and an assumption that model servers never go down.

I spent the last several weeks replacing those assumptions with structural guarantees.

<figure>
  <img src="../../../data/agent_resilience_architecture_2026_11_08.png">
  <figcaption>Hardened agent architecture: worker-thread turn runners, ContextVar scoping, native DuckDB AST contracts, per-thread database cursors, and isolated circuit breakers</figcaption>
</figure>

### What actually broke

Before writing any new abstractions, I built tests to show the existing code failing.

Regex SQL validation accepted cross joins without conditions, negated entity filters, `OR 1=1` bypasses, and file-read table functions like `read_csv_auto('/etc/passwd')`. House Chat scope was an English sentence appended to the prompt; nothing checked that the model followed it. "Top N" limits were parsed but hard-coded to 10 at execution time.

On the server side, chat turns ran synchronously inside `async def` endpoints, so a 0.6 s turn blocked the entire event loop. One shared DuckDB connection across threads caused corrupted DataFrames under concurrent load. If `llama-server` was down, the backend returned HTTP 500 everywhere, even for endpoints that need no model at all. Phoenix span export was synchronous, burning ~7.8 s per span in connection retries when no collector was running.

<figure>
  <img src="../../../data/resilience_benchmark_proofs.png">
  <figcaption>Measured before/after: event loop lag from 591 ms to 7 ms; collector-offline span stall from 156 s to 0.7 ms; concurrent DuckDB reads from 28 corrupted queries to 300/300 clean</figcaption>
</figure>

To quantify the difference, I ran four benchmarks directly against the application. First, measuring event loop lag with an asyncio heartbeat while running a 0.6 s turn: inline execution froze the loop for 591 ms, whereas offloading to the worker thread kept lag under 7 ms. Second, recording 20 OpenTelemetry spans with the Phoenix collector offline: synchronous retries stalled execution for 156 s, while the background batch exporter finished in 0.7 ms. Third, launching 12 concurrent worker threads executing 300 total reads against DuckDB: sharing a single connection cursor corrupted 28 queries with empty or invalid frames, while isolated per-thread cursors achieved 300 clean reads. Finally, the added overhead of inspecting native DuckDB ASTs was 870 microseconds per query compared to 6 microseconds for raw regex, an acceptable trade-off for true parse-tree verification.

### SQL verification via the native AST

Regex over raw SQL text misses conditions buried in comments, filters negated or ORed out, and table functions hidden in subqueries. `agents/sql_inspector.py` calls DuckDB's own `json_serialize_sql` to produce a native AST (~0.3 ms, no extra dependency, no dialect mismatch). `agents/plan_contract.py` checks that AST in two tiers. The safety tier blocks file access, system functions, and non-catalog tables. The contract tier verifies joins only use declared catalog relationships, every required filter is present and un-negated, and any user-stated "top N" is honored by a matching `LIMIT`.

### House Chat scope via ContextVar

Scoping House Chat to one property with a prompt sentence works until a model ignores it. `agents/query_scope.py` sets a `ScopeFilter` around every House Chat turn using a `contextvars.ContextVar`. The planner picks it up structurally and the contract verifies it is present and un-negated before any query runs. A model that deliberately omits the house predicate gets its SQL rejected and the deterministic fallback compiler substitutes the scoped version. The old prose ("This is House Chat for house_id=...") is gone, which also stops the word "house" from distorting concept matching. Cross-house queries require an explicit `scope="all_houses"` parameter.

The ContextVar travels with the call onto the worker thread and cannot be observed or overridden by model output.

```python
with query_scope.scoped(query_scope.ScopeFilter("houses", "house_id", house_id)):
    return await turn_runner.run_turn(lambda: house_agent.run_chat(message, history))
```

### Concurrency, timeouts, and the event loop

`db/duckdb_store.py` now gives each thread its own cursor via `threading.local()`. Queries run through `store.query_limited()`. A watchdog thread interrupts statements that exceed 30 s and raises `SqlTimeout`, which is reported and not retried. Materialization is capped at 50,000 rows.

`agents/turn_runner.py` offloads every chat turn via `asyncio.to_thread`, keeping the event loop free. A concurrency cap, queue timeout (503 with `Retry-After`), and turn deadline (504) are enforced at the HTTP layer. `GET /api/agent/status` answers in under 150 ms even during heavy turns.

### Circuit breakers and graceful degradation

`agents/llm_resilience.py` distinguishes transient failures (timeouts, 5xx) from permanent ones (bad request, context overflow). Three consecutive transient failures open the breaker for 30 s. Breakers are split across `chat`, `semantic`, and `relationships` roles so a failed optional feature cannot take down the primary agent. When the model is offline, planning and the deterministic SQL compiler still run. The answer endpoint returns the evidence with a note that the LLM is unavailable.

### Propose-only assists

When a query matches no catalog alias, `agents/semantic_fallback.py` lets a model suggest concept keys from a closed list. Invented keys are discarded, suggestions are capped at three, and results are cached per request. When an uploaded dataset's column names have no overlap with existing tables, `services/relationship_suggestions.py` lets a model propose join pairs to test. Each suggestion passes the same value-containment checks as a name-based candidate and still needs human approval before the join is published to the catalog.

### Observability overhead

Switching the Phoenix exporter from synchronous to background batch (`phoenix_batch_export=True`) drops the collector-offline penalty from ~7.8 s per span to under 1 ms total for a full turn. The tracing code paths are now covered by an in-memory OpenTelemetry tracer so tests stay hermetic.

---

Code is available on [GitHub](https://github.com/SNaveenMathew/real_estate_app_v1).
