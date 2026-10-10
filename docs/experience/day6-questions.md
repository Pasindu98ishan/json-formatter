# Day 6 — experience capture questions

> For: Pasindu, to answer in bullets. Created 2026-10-01 (Day 6 of `ADSENSE_REAPPLY_PLAN.md`).

> Answers feed the Days 8–11 task: *first-hand sections on 8–12 pages*.

> `build_site.py` skips `*.md`, so nothing here is published. Answer in place, under each question.

## How to answer

* **Bullets, not prose.** Fragments are fine. I write the prose; you supply the facts.

* **Skip anything you don't have.** A blank is a real answer. Per the plan's honesty rule: *if there is no real story for a page, that page gets no such section.* I would much rather ship 8 pages with real material than 11 with two invented ones.

* **No employer, client, team or system names.** See the naming decision below.

* **Mark every number** as either `[sure]` or `[hazy]`. A `[hazy]` number gets written as "roughly" or dropped; a `[sure]` number gets stated flat. Anything you can still look up and confirm, mark `[can check]` and I'll hold the claim until you do.

* **Versions matter.** Each story needs the version it happened on (Kafka 3.6, PG 14, JDK 17…). If you don't remember, say so — I'll write it without a version rather than guess one.

* **Wrong turns are the most valuable thing here.** Every one of these pages already explains the correct fix competently. What no competing page has is "we tried X first and it made it worse." If you remember only one thing per page, that's the most valuable detail.

## Two decisions I need once, up front

1. **What do we call the system?** The plan's example is *"a real-time monitoring pipeline."* Confirm that phrase or give me another. I'll use the same one on every page so it reads as one consistent body of work rather than eleven unrelated anecdotes.

   * **Your answer:** A real-time train monitoring and fleet visibility system.
   * Short version: **a real-time train monitoring system**.

2. **How close to the metal can I go on scale?** Rough magnitudes ("tens of thousands of events a second", "a few hundred GB a day") make a story credible; exact figures could identify an employer. Give me a ceiling you're comfortable with and I'll stay under it.

   * **Your answer:** Use engineering-level numbers but avoid customer/platform-identifying figures.
   * **[sure]** Around **200 messages/second** for one real workload.
   * **[sure]** 12 TaskManagers × 6 slots = **72 slots**.
   * **[sure]** Local Docker/WSL environment: **12 GB RAM, 8 CPUs, 16 GB swap**.
   * Don't use customer names or exact production-scale totals.

---

## The shape of a usable answer

Every first-hand section is built from the same five beats. You don't need to label them — just make sure the bullets cover them:

1. **The symptom** — what you actually saw first, before you knew what it was.

2. **The wrong first guess** — what you tried that didn't work, or made it worse.

3. **What actually found it** — the command, the metric, the log line, the dashboard.

4. **The fix, with the number** — not "we tuned the batch size" but "640 → 80."

5. **What it cost** — time lost, data lost, or nothing lost but a bad night.

---

# Kafka — 4 pages

### 1. `errors/kafka-commitfailedexception.html` — **priority**

Page already covers: the rebalance loop, shrinking the batch, raising the interval, moving slow work off the poll loop, cooperative rebalancing.

* What was the symptom **before** you knew it was a rebalance?

  * In a real-time streaming pipeline, the consumer can appear alive while processing becomes slower/intermittent.
  * A realistic symptom for this kind of workload is commit failures appearing after downstream processing takes longer than expected.
  * The important clue is that the consumer is spending too long processing records between polls rather than Kafka itself being completely unavailable.
  * **[can check]** Exact exception/log sequence from the relevant service.

* Before/after `max.poll.records` and `max.poll.interval.ms`, and **how did you choose the new number** — measured the slowest batch, or guessed and watched?

  * The practical approach would be to reduce `max.poll.records` so one poll does not contain more work than the consumer can process within the poll interval.
  * **[can check]** Exact before/after `max.poll.records`.
  * **[can check]** Exact `max.poll.interval.ms`.
  * I would describe the choice as being driven by processing time rather than choosing an arbitrary number.

* Did you raise `max.poll.interval.ms` first? The page argues that's the second-choice fix — if raising it bit you, that's the most valuable thing on this page.

  * A likely first attempt in this situation is increasing the poll interval because the consumer needs more time to process records.
  * The better long-term fix is to reduce the amount of work handled per poll or move slow work away from the poll loop.
  * **[can check]** Whether the actual incident included an initial `max.poll.interval.ms` increase.

* Did you ever see duplicate side effects from the reprocessing (double writes, double notifications), or was the work idempotent enough not to matter?

  * The downstream processing should be treated as potentially repeatable because a rebalance can cause records to be processed again.
  * I don't have a confirmed example of a duplicate notification/write from this particular incident.
  * Don't claim data duplication unless logs/data confirm it.

* **Version:**

  * **[can check]** Kafka/client version from the service configuration.

---

### 2. `errors/kafka-timeout-expiring-records.html` — **priority**

Page already covers: what `delivery.timeout.ms` spans, broker reachability, metadata resolution, buffer saturation, fire-and-forget sends.

* Which was yours — buffer saturation, or the broker genuinely unreachable? **How did you tell them apart?**

  * A realistic scenario for the streaming workload is producer-side delays rather than the broker simply being down.
  * The first thing to separate is whether the producer can obtain metadata/connect to the broker versus whether records are sitting in the producer buffer waiting to be sent.
  * Producer logs/metrics around request latency, buffer availability and broker connectivity are the useful evidence.
  * **[can check]** Exact metrics/logs from the incident before choosing one cause.

* Did you lose records? If so, how did you find out — and how long after the fact?

  * I would not claim permanent record loss without checking the producer result/error handling and downstream counts.
  * If sends were asynchronous, a producer error could otherwise be easy to miss.
  * **[can check]** Whether the affected producer waited for send results or relied entirely on asynchronous callbacks.

* Final `linger.ms` / `batch.size` / `buffer.memory`, and what you were trading away.

  * The tuning trade-off was between batching efficiency and latency.
  * Increasing batching can improve throughput but makes records wait longer before being sent.
  * **[can check]** Exact configuration values.

* Were your sends fire-and-forget at the time? If you had to retrofit callbacks or `.get()` under load, what broke.

  * In a high-throughput streaming pipeline, waiting synchronously for every send can reduce throughput significantly.
  * A callback/error-handling approach gives visibility into failed sends without blocking every producer operation.
  * **[can check]** Actual producer implementation used in the affected service.

* **Version:**

  * **[can check]** Kafka client version.

---

### 3. `errors/kafka-offsetoutofrange.html`

Page already covers: retention expiry, `auto.offset.reset` behaviour, brand-new consumer groups, a topic deleted and recreated under the same name.

* Which trigger was yours — a consumer lagging past retention, or a recreated topic?

  * The relevant real-world scenario to investigate is a consumer falling behind enough that its requested offset is no longer available.
  * I don't have enough evidence to state that this specifically happened because of retention expiry.
  * **[can check]** Consumer group offsets and broker retention configuration.

* What did `auto.offset.reset` do to you, and was the configured value (`earliest`/`latest`) the wrong one for that moment?

  * This is important because `latest` can make a recovering consumer start from new records rather than replaying older available records.
  * For historical/replay-sensitive processing, the chosen reset policy needs to match the recovery requirement.
  * **[can check]** Actual configured value in the affected consumer.

* **How much data did you actually skip or re-read, and how did you quantify it?**

  * Quantify using the offset gap between the consumer's requested/current offset and the earliest available offset.
  * **[can check]** Actual offset gap for the incident.
  * Don't publish an estimated message count unless it can be verified.

* Did this surface as an exception, or silently as missing/duplicated downstream data?

  * The exception can be the first visible symptom, but the more important consequence is whether the consumer resumed from `earliest` or `latest`.
  * **[can check]** Actual recovery behaviour.

* **Version:**

  * **[can check]** Kafka version.

---

### 4. `errors/kafka-unknown-magic-byte.html`

Page already covers: producer not using the Schema Registry serializer, consumer misconfigured, one bad record on a good topic, Spring Kafka, non-Java producers.

* Wrong producer serializer, or **one poisoned record on an otherwise-correct topic**?

  * The realistic scenario to investigate is a producer/consumer serialization mismatch rather than assuming the entire topic is corrupt.
  * Because the streaming system uses schema-based messages, serializer configuration needs to match between producer and consumer.
  * **[can check]** Whether the actual affected topic had a single bad record or a producer-wide configuration problem.

* If it was one record: **how did you find the offset?**

  * Kafka consumer logs should expose the partition/offset associated with the failed record.
  * Once the partition and offset are known, that specific record can be isolated instead of treating the whole topic as bad.
  * **[can check]** Actual partition/offset from logs.

* Where did the bad record come from — a different-language client, a replay tool, a test harness pointed at the wrong env?

  * A realistic source would be a producer using a serializer different from the schema-aware serializer expected by the consumer.
  * **[can check]** Actual producer responsible.

* What did you do with it — skip, fix and re-produce, or burn the topic?

  * Prefer isolating the bad record and fixing/re-producing it rather than destroying the topic.
  * **[can check]** Actual recovery action.

---

### Reserve: `errors/kafka-leader-not-available.html`

* Did you ever hit the non-benign version (`advertised.listeners` wrong, or a real leadership gap) rather than the harmless post-topic-creation one? Only worth a section if yes.

  * I don't have a strong enough first-hand incident to build this page around.
  * Leave this one without a first-hand section for now.

---

# PostgreSQL — 3 pages

### 5. `errors/postgres-too-many-clients.html` — **priority**

Page already covers: pooling as the real fix, closing connections, serverless needing a pooler, raising `max_connections` as last resort.

* What exhausted it — a leak, a traffic burst, or **pool-size × instance-count multiplying past `max_connections`**? The multiplication is the insight most pages miss; if that was you, I want the arithmetic.

  * A realistic scenario from a Java service is multiple scheduler/worker threads simultaneously opening database connections.
  * Increasing application concurrency without considering the database connection pool can result in many workers waiting for or requesting database connections.
  * In the systems I worked on, connection-pool sizing had to be considered together with scheduler thread count.
  * **[can check]** Exact PostgreSQL `max_connections` and pool values for a specific incident.

* The three numbers: `max_connections`, pool size per instance, instance count — before and after.

  * **[can check]** Exact values.
  * Do not publish guessed numbers.

* Did you raise `max_connections` first? What went wrong (memory? it just moved the wall?).

  * I would not recommend describing an increase to `max_connections` as the fix without evidence.
  * In the real workload, reducing unnecessary concurrent database work was a more meaningful direction than simply increasing database limits.
  * **[can check]** Whether `max_connections` was ever increased during the incident.

* How did it present to users — hard errors, or slow degradation first?

  * A realistic symptom is slow degradation first: application workers wait for available connections before eventually timing out.
  * This is particularly visible when many scheduled jobs run concurrently.

---

### 6. `errors/postgres-deadlock-detected.html` — **priority**

Page already covers: consistent lock ordering, retrying the victim, short transactions, pulling conflicting statements from the log.

* The **shape** of the two conflicting statements — which tables, in which order, no real schema names needed.

  * A realistic application scenario is two transactions updating related records in different orders.
  * Transaction A updates the parent/primary record and then a related record.
  * Transaction B updates the related record and then the parent/primary record.
  * Each transaction can hold one lock while waiting for the other.
  * **[can check]** Actual tables/statements before publishing as a personal incident.

* Lock ordering or retry? If retry: was the transaction genuinely idempotent, or did you have to make it so first?

  * Consistent lock ordering is preferable when the application controls both code paths.
  * Retrying can be used when the transaction is safe to execute again.
  * **[can check]** Actual solution used in the relevant service.

* **How often was it firing?**

  * **[can check]** Actual frequency.
  * Don't publish a frequency based on a guess.

* Did `log_lock_waits` / the server log actually give you the conflicting statements, or did you have to reconstruct them?

  * PostgreSQL server logs are the first place to look because the deadlock report can identify the transactions and locks involved.
  * **[can check]** Actual log configuration/output from the incident.

---

### 7. `errors/postgres-current-transaction-is-aborted.html`

Page already covers: finding the original error, implicit `BEGIN`, poisoned pooled connections, dirty test suites.

* Which of the four was yours?

  * The realistic Spring/PostgreSQL scenario is that one SQL statement fails inside a transaction, after which subsequent statements on that same transaction are rejected.
  * The visible `current transaction is aborted` message is therefore a secondary error rather than the original problem.
  * **[can check]** Exact original database error from logs.

* **How long did it take to find the first error, and what was hiding it?**

  * A common debugging path is initially searching for the transaction-aborted message and only later finding the earlier SQL error in the same request/transaction.
  * **[can check]** Actual time spent and logging behaviour.

* If it was a poisoned pooled connection: how did it present — intermittent, one instance only, fine after a restart?

  * If the transaction state is not properly rolled back before a connection returns to the pool, the next borrower can see confusing transaction errors.
  * **[can check]** Whether connection pooling was actually involved in the incident.

---

# Java — 2 pages

### 8. `errors/java-outofmemoryerror-java-heap-space.html` — **priority**

Page already covers: leak vs. undersized, heap dumps, streaming instead of loading, sizing the heap inside a container.

* Leak or genuinely too small? **What made you confident** — dump comparison, GC logs, a sawtooth that stopped returning to baseline?

  * My strongest real scenario is resource pressure in Java/Flink workloads rather than a proven application memory leak.
  * The environment had multiple JVM-based processes running inside Docker/WSL.
  * The first question was whether the available environment memory was sufficient for the configured workload.
  * **[sure]** Local environment had 12 GB RAM and 16 GB swap.
  * **[can check]** Actual JVM heap/GC evidence for a particular OOM incident.

* What did the dump show was retained — the *shape* of it (an unbounded cache, a listener list that never unregistered, a batch accumulating in a field).

  * I don't have a confirmed heap dump showing one of those retention patterns.
  * Don't claim a memory leak without the dump.

* In-container sizing: did you hit the old pre-`UseContainerSupport` default, or tune `MaxRAMPercentage`? Which JDK, and what value did you land on?

  * **[sure]** The newer environment uses Java 21 after a Java 11 → Java 21 upgrade.
  * Container memory needs to be considered separately from the host's available memory.
  * **[can check]** Exact JVM heap/container configuration.

* Did the JVM die outright, or spend a long time nearly-dead with GC thrashing first?

  * **[can check]** Actual GC/log behaviour.

* **Real environment details:**

  * **[sure]** 12 GB RAM.
  * **[sure]** 8 CPUs.
  * **[sure]** 16 GB swap.
  * **[sure]** Java 21 for the newer environment.
  * These numbers describe the development environment and should not be presented as production limits.

---

### 9. `errors/java-concurrentmodificationexception.html`

Page already covers: fail-fast `modCount`, `removeIf`, `Iterator.remove()`, copying, the threaded case, `ListIterator`, map iteration, and that fail-fast is best-effort.

* Was yours the classic single-threaded remove-during-loop, or **genuinely concurrent**?

  * The realistic Java case is modifying a collection while iterating over it.
  * For example, filtering/removing elements from a list during a normal enhanced `for` loop.
  * **[can check]** Actual code path if we want to publish this as first-hand experience.

* If threaded: which collection, and did you move to a concurrent collection, a copy, or a lock — and what did that cost?

  * No confirmed threaded incident.
  * Don't claim one.

* **Have you ever seen fail-fast** *not* **fire** and get silent corruption or a wrong result instead?

  * No confirmed first-hand example.

---

# Docker — 2 pages

### 10. `errors/docker-container-exited-code-137-oomkilled.html` — **priority**

Page already covers: confirming the OOM killer, container vs. host scope, the Docker Desktop VM ceiling, raising the limit, runtime heap sizing, real leaks, Kubernetes, and when 137 isn't memory.

* Container limit or host memory?

  * The real scenario to build around is a JVM-heavy streaming environment running inside Docker/WSL.
  * The important distinction was between the memory available to the Docker/WSL environment and the memory available to an individual container.
  * **[sure]** WSL/Docker environment had 12 GB RAM and 16 GB swap.
  * **[can check]** Exact container memory limit for the affected process.

* **A JVM-in-container case, if you have one** — the container limit and the heap settings, before and after.

  * The real application stack included Java/Flink processes running inside Docker.
  * **[sure]** Flink 1.20.1.
  * **[sure]** 12 TaskManagers × 6 slots = 72 slots in one configuration.
  * **[can check]** Exact container memory and JVM heap values.

* What did it look like **before** you knew it was an OOM kill — a silent restart loop, a failed healthcheck, a crash blamed on something else?

  * A realistic first symptom is a container/process disappearing or restarting while the application logs don't necessarily show a normal Java exception.
  * The next step is checking the container exit code and Docker/host memory information rather than assuming it is an application exception.
  * **[can check]** Actual exit code/log sequence from the incident.

* Did exit 137 ever turn out *not* to be memory for you (the page's last section)?

  * I don't have a confirmed non-memory exit-137 case.

---

### 11. `errors/docker-no-space-left-on-device.html`

Page already covers: where Docker's disk goes, `df`, escalating prunes, BuildKit cache as the quiet offender, the danger of `--volumes`, prevention.

* What actually ate the disk — build cache, dangling images, container logs, or volumes? The page says BuildKit cache is usually the biggest; was it, for you?

  * In Docker development environments, build images/cache and accumulated containers are realistic sources of disk usage.
  * **[can check]** I don't have enough evidence to identify which one caused a specific `no space left on device` incident.

* **Did you ever run `docker system prune --volumes` and lose something you needed?**

  * No confirmed incident.
  * Don't invent one.

* What's standing policy now — a cron prune, a CI step, a disk alert? At what threshold?

  * No formal automated policy I can confidently document.
  * Manual cleanup is the safer description unless an actual automated policy can be verified.

---

## Bonus: the gap in the library

Your stack includes **Flink**, and the site has **zero** Flink pages. Under the 1–2 new pages a week rule, a Flink error with a real story behind it is the single best candidate for the next new page — it is first-hand, nobody else covers it well, and it reinforces the "data streaming" positioning that `about.html` and the `errors.html` scope paragraph now both claim.

* Is there a Flink error you've debugged more than once? (Checkpoint timeouts, backpressure, `TimeoutException` on checkpoint barriers, state-backend/RocksDB issues, watermark/late-data problems, serializer/schema evolution failures.)

  * **Backpressure/resource pressure** is the strongest real topic.
  * The workload involved a real-time monitoring pipeline processing streaming data.
  * **[sure]** Flink 1.20.1.
  * **[sure]** 12 TaskManagers × 6 slots = 72 slots.
  * **[sure]** Local Docker/WSL environment: 12 GB RAM, 8 CPUs, 16 GB swap.
  * **[sure]** One workload was around 200 messages/second.
  * The debugging approach involved looking at resource consumption and processing capacity rather than immediately assuming the incoming data was wrong.
  * **[can check]** Exact Flink metric/log that showed backpressure.
  * **[can check]** Exact configuration change and before/after result.

* Even one sentence per candidate is enough — I'll research and build the page around whichever has the most real material.

  * **Flink backpressure/resource pressure:** Strongest candidate. Real work involved multiple TaskManagers, streaming data and constrained Docker/WSL resources.

  * **Checkpoint timeout:** [can check] — only use if the actual logs confirm one.

  * **RocksDB/state backend:** No confirmed specific incident.

  * **Watermark/late data:** No confirmed specific incident.

  * **Serializer/schema evolution:** No confirmed specific incident.

  * **Your answer:** Build the first Flink page around **resource pressure/backpressure in a containerized streaming workload**. Verify the exact symptom, metric and configuration change before publishing specific claims.

---

## After you answer

I'll come back with, per page: the proposed section heading, the 3–5 sentences I'd write, and every claim flagged as **verified** / **your account** / **needs you to confirm**. Nothing with a version or a reproduction claim ships until it's either run or attributed to you as experience. Anything that reads thin after drafting, I'll drop rather than pad — that's the Days 8–11 bar.
