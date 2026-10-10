# Reproduction log — option B evidence (Days 8–11)

> Created 2026-10-03. Every claim added to a page under option B of `ADSENSE_REAPPLY_PLAN.md` §9 is listed here with the runtime it was captured on and the command that produced it, so any of it can be re-run and checked.
> Scripts live in the session scratchpad; the commands below are the substance. All containers were removed after each run.

**Runtimes used:** PostgreSQL 16.15 (`postgres:16-alpine`) · Java 21.0.11 (local, and `eclipse-temurin:21-jre-alpine`) · Docker 25.0.2 · Apache Kafka 3.9.0 (`apache/kafka:3.9.0`, KRaft single node)

---

## 1. `errors/postgres-deadlock-detected.html` — PostgreSQL 16.15

Two sessions, reversed lock order: A updates `parent` then `child`; B updates `child` then `parent`.

```
ERROR:  deadlock detected
DETAIL:  Process 106 waits for ShareLock on transaction 737; blocked by process 113.
         Process 113 waits for ShareLock on transaction 736; blocked by process 106.
HINT:  See server log for query details.
CONTEXT:  while updating tuple (0,1) in relation "child"
```

Server log, same event — note it carries the statements the client error does not:

```
[106] DETAIL:  Process 106 waits for ShareLock on transaction 737; blocked by process 113.
	Process 113 waits for ShareLock on transaction 736; blocked by process 106.
	Process 106: UPDATE child SET qty=qty+1 WHERE id=1;
	Process 113: UPDATE parent SET name='B' WHERE id=1;
```

**Findings**
- The client error says only `See server log for query details`. It never names the conflicting statements. The server log does, in the `DETAIL` of the same report.
- The deadlock surfaced on A's *second* statement, and `CONTEXT` names the relation it blocked on (`child`), not the one it already held.
- **Victim selection — first reading was wrong, corrected by a second test.** This run aborted A, which had begun ~0.4 s *before* B, so the first guess was "the transaction that started first loses." A follow-up varying the wait times falsified that:

  | A blocks at | B blocks at | cycle closes | aborted |
  |---|---|---|---|
  | t = 1s | t = 6s | t = 6s | **B** |
  | t = 6s | t = 1s | t = 6s | **A** |
  | t = 2.0s | t = 2.4s | t = 2.4s | **A** |

  Neither "first in wins" nor "last in loses" holds. The actual rule is **whichever backend's `deadlock_timeout` expires first *after* the cycle closes** — in rows 1–2 the earlier waiter's timer had already fired and found nothing, leaving the later one to detect it; in row 3 the two blocks were 0.4 s apart, inside the 1 s timeout, so the earlier waiter's timer got there first. Practical consequence written onto the page: you cannot designate one path as "the one that gets retried", so retry handling must be safe on **both** sides of the pair.

## 2. `errors/postgres-too-many-clients.html` — PostgreSQL 16.15

`max_connections=10`, `superuser_reserved_connections=3` (default), plus a non-superuser role `app`.

```
succeeded: 7    refused: 3
FATAL:  remaining connection slots are reserved for roles with the SUPERUSER attribute
```

With all 7 app slots held, a superuser still connected and could run `pg_stat_activity`:

```
 usename  | count |  max
----------+-------+--------
 app      |     7 | active
 postgres |     1 | active
```

**Findings**
- A normal role's wall is `max_connections − superuser_reserved_connections` — **7 of 10 here**, not 10.
- **Two different messages, and which one you get tells you where you are.** A non-superuser exhausting the non-reserved pool gets `remaining connection slots are reserved for roles with the SUPERUSER attribute`. `sorry, too many clients already` appears only when the reserved slots are gone too.
- Consequence for the page's "see what is holding connections" step: in a separate run where the *holders themselves* connected as `postgres`, all 10 slots filled and even a superuser was refused with `sorry, too many clients already` — so **if the app connects as a superuser the reserve protects nothing, including your ability to diagnose.**

## 3. `errors/postgres-current-transaction-is-aborted.html` — PostgreSQL 16.15

`BEGIN`, a duplicate-key insert, then a series of statements:

```
ERROR:  duplicate key value violates unique constraint "t_pkey"
DETAIL:  Key (id)=(1) already exists.
ERROR:  current transaction is aborted, commands ignored until end of transaction block   (x6)
```

**Findings**
- Re-confirms that `SELECT`, `SET`, `SHOW`, `SAVEPOINT` and `RELEASE SAVEPOINT` are **all** rejected with 25P02 — six statements, six errors. Only transaction-ending statements pass.
- `COMMIT` on an aborted transaction is answered `ROLLBACK`.
- After `ROLLBACK` the same session works again immediately.

## 4. `errors/java-concurrentmodificationexception.html` — Java 21.0.11

Removing one element from an `ArrayList` during a for-each, varying which element:

```
list is [A, B, C]
remove "A" (first)           threw CME      visited=[A]        final=[B, C]
remove "B" (second-to-last)  NO EXCEPTION   visited=[A, B]     final=[A, C]
remove "C" (last)            threw CME      visited=[A, B, C]  final=[A, B]

second-to-last removal at other sizes:
  size 2, removed e0   NO EXCEPTION   visited=[e0]              final=[e1]
  size 3, removed e1   NO EXCEPTION   visited=[e0, e1]          final=[e0, e2]
  size 4, removed e2   NO EXCEPTION   visited=[e0, e1, e2]      final=[e0, e1, e3]
  size 5, removed e3   NO EXCEPTION   visited=[e0, e1, e2, e3]  final=[e0, e1, e2, e4]
```

**Findings — this one corrects the page**
- Removing the **second-to-last** element never throws, at any list size, and the loop **silently exits without visiting the final element**. `visited` is short by one every time.
- Mechanism: `ArrayList.Itr.hasNext()` is `cursor != size`. Removing at `size-2` makes `cursor == size`, so the loop ends and `checkForComodification()` — which lives in `next()` — is never reached.
- The page currently says *"in single-threaded code the exception is reliable enough to treat as a hard signal."* **That is wrong**, and the failure mode is silent wrong output rather than an exception. Corrected on the page.

## 5. `errors/java-outofmemoryerror-java-heap-space.html` — Java 21.0.11 / temurin 21

```
$ java -Xmx32m Oom.java
max heap = 32 MB
caught: java.lang.OutOfMemoryError: Java heap space
retained 14 MB before dying
```

Heap default under a container limit (`eclipse-temurin:21-jre-alpine`):

```
--memory=512m   MaxHeapSize = 128 MB   MaxRAMPercentage = 25.0
--memory=1g     MaxHeapSize = 256 MB   MaxRAMPercentage = 25.0
--memory=2g     MaxHeapSize = 512 MB   MaxRAMPercentage = 25.0
bool UseContainerSupport = true {product} {default}
```

**Findings**
- Only **14 MB of a 32 MB heap** was retainable — you do not get to fill `-Xmx` with live data; GC headroom and the `ArrayList` copy-on-grow take the rest.
- `UseContainerSupport` is on by default and the default heap is **25 % of the container limit**, so a 512 MB container runs a 128 MB heap unless told otherwise.
- **An explicit `-Xmx` overrides container awareness** — see §6 case D.

## 6. `errors/docker-container-exited-code-137-oomkilled.html` — Docker 25.0.2

| Case | `ExitCode` | `OOMKilled` |
|---|---|---|
| A — PID 1 is the memory hog | **137** | **true** |
| B — a child is OOM-killed, PID 1 then exits 0 | **0** | **true** |
| C — external `docker kill`, no memory pressure | **137** | **false** |
| D — JVM, `-Xmx512m` inside `--memory=128m` | **137** | **true** |

Case D vs. a correctly-sized heap:

```
-Xmx64m  in --memory=256m : maxMemory=61MB; "CAUGHT in Java: java.lang.OutOfMemoryError: Java heap space"; ExitCode=0  OOMKilled=false
-Xmx512m in --memory=128m : maxMemory=494MB; (no Java output at all);                                     ExitCode=137 OOMKilled=true
```

**Findings**
- **Exit 137 and `OOMKilled` are orthogonal in both directions.** Case C is 137 without memory pressure; **case B is an OOM kill that exits 0** — so reading the exit code alone can tell you "not memory" when it was. `docker inspect --format '{{.State.OOMKilled}}'` is the only authoritative signal.
- In case B `docker ps -a` showed `Exited (0)`, which is exactly how the trap presents.
- Case D is the discriminator worth having: **a Java `OutOfMemoryError` stack trace means the JVM stayed inside its limits; a 137 with no Java output at all means `-Xmx` was larger than the container.** The JVM reported `maxMemory=494MB` inside a 128 MB container — it trusts `-Xmx` over the cgroup limit.

## 7. `errors/docker-no-space-left-on-device.html` — Docker 25.0.2

Size-capped tmpfs as a safe stand-in for a full Docker directory:

```
$ dd if=/dev/zero of=/tight/fill bs=1k count=4096
dd: error writing '/tight/fill': No space left on device
1025+0 records in
1024+0 records out
exit=1

$ tar -cf /tight/x.tar /bin
tar: write error: No space left on device
```

Real accounting on this host, for the shape of the output:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          22        8         10.06GB   4.367GB (43%)
Containers      8         6         1.132GB   4.145MB (0%)
Local Volumes   20        4         1.017GB   693MB (68%)
Build Cache     31        0         1.867kB   1.867kB
```

**Findings**
- The write **partially succeeds** — `dd` wrote 1024 of 4096 records before failing, so a truncated file is left behind. Exit code 1, not a clean refusal.
- Different tools word it differently (`dd: error writing …`, `tar: write error: …`), so the searched string varies by what was running.
- On this host the reclaimable split was **images 43 %, volumes 68 %, build cache ~0** — a useful counter-example to the assumption that build cache is always the offender.

## 8. `errors/kafka-offsetoutofrange.html` — Apache Kafka 3.9.0

Produce 20, consume 5 with group `g1` (commits offset 5), then `kafka-delete-records.sh` to offset 12 so the log start overtakes the commit.

```
partition: t1-0	low_watermark: 12
log start offset: t1:0:12      log end offset: t1:0:20
```

Group state *after* the delete:

```
GROUP  TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
g1     t1     0          5               20              15
```

Resuming `g1` with `auto.offset.reset=none`:

```
org.apache.kafka.clients.consumer.OffsetOutOfRangeException: Fetch position
FetchPosition{offset=5, offsetEpoch=Optional.empty, currentLeader=LeaderAndEpoch{
leader=Optional[localhost:9092 (id: 1 rack: null)], epoch=0}} is out of range for partition t1-0
	at org.apache.kafka.clients.consumer.internals.FetchCollector.handleInitializeErrors(FetchCollector.java:365)
```

A fresh group with `auto.offset.reset=earliest` on the same topic started at `msg-13`.

**Findings**
- **`kafka-consumer-groups.sh --describe` keeps reporting `CURRENT-OFFSET 5` and `LAG 15` after offset 5 has ceased to exist.** It computes lag as `LOG-END-OFFSET − CURRENT-OFFSET` without comparing against the log start offset. True reachable backlog was `20 − 12 = 8`; the 7 records between 5 and 12 were gone, not lagging. **The lag number is wrong in exactly the situation that causes this error**, and comparing it with `--time -2` is how you catch it.
- With `auto.offset.reset=earliest` the consumer resumed at `msg-13` and **skipped 1–12 with no error at all** — the exception only appears with `auto.offset.reset=none`. The default configuration hides the data loss.
- `kafka-delete-records.sh` is a clean deterministic way to reproduce this without waiting on retention.

---

## What is *not* claimed

None of the above is presented on the pages as a production incident, because it is not one. Each is captured output from a container started for the purpose, and each page states the version it was captured on. Where a reproduction merely confirmed what a page already said (items 2 and 3), the page gains a version pin and nothing more.
