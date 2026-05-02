# Normalization Algorithm Specification

## 1. Normal Form Rules Reference

This section defines the theoretical basis for each normal form, focusing on how Functional Dependencies (FDs) relate to each level of normalization.

---

### 0NF — Unnormalized Form

Not a "normal" form in the strict sense; it is the baseline raw data state. A schema is considered 0NF if:

- Data for the domain is captured in tables.
- Primary keys are identifiable.
- Repeating groups and multi-valued fields may exist and are acceptable.

**Role of FDs at this stage:** None required. The schema may be structurally incomplete.

---

### 1NF — First Normal Form

A schema is in 1NF if:

- All attribute values are **atomic** — no multi-valued or composite values stored in a single cell.
- There are **no repeating groups or arrays** — no `phone1`, `phone2`, `phone3` patterns.
- Every row is **uniquely identified** by a primary key.
- Attribute names are **unambiguous** within each table.

**Role of FDs at this stage:** FDs can exist and be drawn, but 1NF compliance is determined by structural and naming properties, not by FDs themselves.

---

### 2NF — Second Normal Form

A schema is in 2NF if:

- It is in **1NF**, AND
- Every **non-key attribute** is **fully functionally dependent** on the **entire** primary key — not just a part of it.

**Partial dependency (violation):** A non-key attribute `X` is partially dependent on the PK if it depends on a *proper subset* of a composite PK.

> Example: PK = {StudentId, CourseId}. If `StudentName` depends only on `StudentId`, that is a partial dependency → 2NF violation.

**Role of FDs:** FDs are the primary evidence. Each FD drawn on the canvas is an explicit dependency claim made by the student. The algorithm reads FD starts and ends to detect partial dependencies.

**Key rule:** 2NF only applies when the PK is **composite** (2+ columns). A single-column PK table is automatically in 2NF.

---

### 3NF — Third Normal Form

A schema is in 3NF if:

- It is in **2NF**, AND
- There are **no transitive dependencies** — no non-key attribute determines another non-key attribute.

**Transitive dependency (violation):** If `PK → A` and `A → B`, where `A` and `B` are both non-key attributes, then `B` is transitively dependent on `PK` through `A`.

> Example: PK = {OrderId}. If `OrderId → CustomerId` and `CustomerId → CustomerName`, then `CustomerName` is transitively dependent on `OrderId`. Violation.

**Role of FDs:** The algorithm traverses the FD graph drawn by the student. Any FD whose *entire* set of start attributes are non-key attributes, and whose end attributes include at least one non-key attribute, is a transitive dependency.

---

## 2. Pre-flight Checks (Structural Baseline)

These checks run **before** any NF-specific algorithm. They apply to every stage.

| Check | Level | Condition |
|---|---|---|
| Stage not initialized | Info | Stage has no tables → skip all checks, display "Stage not initialized" |
| Empty stage | Error ❌ | Zero tables on canvas → all NF checks blocked |
| Missing PK | Error ❌ | Table has no `is_PK = true` attribute |
| Duplicate table names | Warning ⚠️ | Two or more tables in the same stage share the same name |

**Rules:**
- If the stage has no tables → all algorithm checks are skipped. The modal shows: *"This stage has no tables. Add tables to the canvas to enable checks."*
- Pre-flight checks run independently; each table is evaluated on its own.
- Orphaned FDs (FD whose start or end `attributeId` is not present as a `TableAttribute` in any table of the current stage) are **silently excluded** from all checks.

---

## 3. Algorithm: 1NF Heuristic Checks

### 3.1 Overview

The algorithm cannot verify semantic atomicity. It runs **naming-pattern heuristics** against attribute names to detect likely non-atomic fields. Results are labeled `Warning ⚠️` — they flag candidates for review, not confirmed violations.

### 3.2 Configurable Pattern Lists

All pattern arrays are defined in a single config object and can be freely edited:

```js
// src/config/normalizationConfig.js

export const NF_CONFIG = {

  // 1NF: Plural suffix patterns
  // Attribute name ends with any of these → likely multi-valued
  PLURAL_SUFFIXES: [
    's', 'es', 'ies',
  ],

  // 1NF: Exclusions from the plural check
  // Words that end in 's' but are NOT plurals
  PLURAL_EXCEPTIONS: [
    'address', 'status', 'class', 'bonus', 'bus', 'alias',
    'canvas', 'census', 'focus', 'campus', 'nexus', 'radius',
    'analysis', 'basis', 'crisis', 'thesis',
  ],

  // 1NF: Known non-atomic keyword substrings (checked anywhere in name)
  NON_ATOMIC_KEYWORDS: [
    'list', 'array', 'csv', 'tags', 'data', 'info',
    'details', 'set', 'collection', 'group', 'items',
    'values', 'entries', 'records', 'json', 'blob',
  ],

  // 1NF: Minimum number of underscore-separated segments to flag as compound
  COMPOUND_SEGMENT_THRESHOLD: 3,
};
```

### 3.3 Heuristic Rules

#### Rule 1NF-A: Plural Attribute Name

**Input:** Attribute `name` (lowercased, trimmed).

**Logic:**
1. Split name on `_` and take the **last segment**.
2. Check if it ends with any suffix from `PLURAL_SUFFIXES`.
3. Check that the full original name is **not** in `PLURAL_EXCEPTIONS`.
4. If both pass → flag.

**Output:** Warning ⚠️ on the attribute row in the table node, tooltip: *"Attribute name appears to be plural — this may represent a multi-valued field, which violates 1NF."*

---

#### Rule 1NF-B: Non-Atomic Keyword

**Input:** Attribute `name` (lowercased).

**Logic:**
1. Check if the name contains any substring from `NON_ATOMIC_KEYWORDS`.

**Output:** Warning ⚠️, tooltip: *"Attribute name contains a keyword suggesting non-atomic storage (e.g. list, csv, array)."*

---

#### Rule 1NF-C: Compound Attribute Name

**Input:** Attribute `name`.

**Logic:**
1. Split on `_`.
2. If segment count ≥ `COMPOUND_SEGMENT_THRESHOLD` → flag.

**Output:** Warning ⚠️, tooltip: *"Attribute name has multiple segments — it may represent composite data (e.g. 'first_last_name'). Consider splitting into separate attributes."*

---

#### Rule 1NF-D: Missing Primary Key

**Input:** `table.tableAttributes`.

**Logic:**
1. If no attribute has `is_PK = true` → flag the table header.

**Output:** Error ❌ on the table header, tooltip: *"Table has no primary key. Every table must have a uniquely identifying attribute."*

---

### 3.4 What 1NF Cannot Detect

- Whether a VARCHAR field actually stores comma-separated values at runtime.
- Whether semantically composite values are stored in a single correctly-named field (e.g. `name` storing "John Doe").
- Attribute name ambiguity across tables.

---

## 4. Algorithm: 2NF Partial Dependency Detection

### 4.1 Overview

For each table in the current stage with a **composite PK** (2+ `is_PK` attributes), the algorithm examines drawn FDs to detect partial dependencies.

### 4.2 Inputs

- `table.tableAttributes` — to determine which attributes are PK and which are non-key.
- `stage.fds` — FDs for this stage.
- Only FDs whose **all** start attributes belong to the current table are evaluated (determines table ownership; ignores orphaned FDs).

### 4.3 Algorithm

```
function check2NF(table, stageFDs):

  pkSet    = Set{ ta.attributeId | ta in table.tableAttributes if ta.is_PK }
  nonKeySet = Set{ ta.attributeId | ta in table.tableAttributes if !ta.is_PK }

  // Single-column PK: auto-pass
  if pkSet.size <= 1:
    return { status: 'pass', reason: 'Single-column PK — partial dependencies impossible' }

  // No FDs drawn: cannot verify
  tableFDs = stageFDs.filter(fd => fd is not orphaned AND fd belongs to this table)
  if tableFDs.length == 0:
    return { status: 'warning', reason: 'No FDs drawn — draw FDs to enable 2NF verification' }

  violations = []

  for each fd in tableFDs:
    startIds = fd.starts.map(s => s.attributeId)
    endIds   = fd.ends.map(e => e.attributeId)

    // Ignore FDs whose start attributes are all non-PK (not relevant to 2NF)
    startInPK = startIds.filter(id => pkSet.has(id))
    if startInPK.length == 0: continue

    // Check if starts are a PROPER SUBSET of the PK (partial)
    isProperSubset = startIds.every(id => pkSet.has(id)) AND startIds.length < pkSet.size

    // Check if any end is a non-key attribute
    endsNonKey = endIds.filter(id => nonKeySet.has(id))

    if isProperSubset AND endsNonKey.length > 0:
      violations.push({
        fdId: fd.id,
        partialKeyAttrs: startIds,
        dependentAttrs: endsNonKey,
      })

  if violations.length > 0:
    return { status: 'error', violations }
  else:
    return { status: 'pass' }
```

### 4.4 Determining Table Ownership of an FD

An FD belongs to table `T` if:
- At least one start `attributeId` exists as a `tableAttribute` in `T`.
- All start `attributeId`s exist as `tableAttributes` in the same table `T`.
- (By system design, FDs are within-table only — cross-table FDs cannot be drawn.)

### 4.5 Output

| Result | Icon | Tooltip |
|---|---|---|
| `pass` (single-column PK) | ✅ | *"Single-column PK — 2NF guaranteed."* |
| `pass` (FDs checked, no violations) | ✅ | *"All non-key attributes are fully dependent on the entire primary key."* |
| `warning` (no FDs drawn) | ⚠️ | *"No FDs drawn for this table. Draw FDs to enable 2NF verification."* |
| `error` (partial dep found) | ❌ | *"Partial dependency detected: [attr] depends only on part of the primary key."* |

Violations are surfaced on: the offending **FD bracket** (inline icon on the canvas) and in the **Check NF Rules modal**.

---

## 5. Algorithm: 3NF Transitive Dependency Detection

### 5.1 Overview

For each table, the algorithm checks every FD whose **entire start set consists of non-key attributes**. If any end attribute is also non-key, that FD represents a transitive dependency. Each such FD is flagged independently.

### 5.2 Algorithm

```
function check3NF(table, stageFDs):

  pkSet     = Set{ ta.attributeId | ta in table.tableAttributes if ta.is_PK }
  nonKeySet = Set{ ta.attributeId | ta in table.tableAttributes if !ta.is_PK }

  tableFDs = stageFDs.filter(fd => fd is not orphaned AND fd belongs to this table)

  if tableFDs.length == 0:
    return { status: 'warning', reason: 'No FDs drawn — draw FDs to enable 3NF verification' }

  violations = []

  for each fd in tableFDs:
    startIds = fd.starts.map(s => s.attributeId)
    endIds   = fd.ends.map(e => e.attributeId)

    // All start attributes must be non-key
    allStartsNonKey = startIds.every(id => nonKeySet.has(id))
    // At least one end attribute must be non-key
    someEndsNonKey  = endIds.some(id => nonKeySet.has(id))

    if allStartsNonKey AND someEndsNonKey:
      violations.push({
        fdId: fd.id,
        determinantAttrs: startIds,
        dependentAttrs: endIds.filter(id => nonKeySet.has(id)),
      })

  if violations.length > 0:
    return { status: 'error', violations }
  else:
    return { status: 'pass' }
```

### 5.3 Graph Traversal Note

The algorithm checks **each drawn FD individually**. Chained transitivity (A→B→C where A is PK, B and C are non-key) is caught because the FD B→C is itself a non-key→non-key link and is flagged directly. There is no need to trace the full chain — each violation is reported as an independent FD.

### 5.4 Output

| Result | Icon | Tooltip |
|---|---|---|
| `pass` | ✅ | *"No transitive dependencies detected."* |
| `warning` (no FDs drawn) | ⚠️ | *"No FDs drawn. Draw FDs to enable 3NF verification."* |
| `error` (transitive dep) | ❌ | *"Transitive dependency: [attr] → [attr] — a non-key attribute determines another non-key attribute."* |

---

## 6. Check Execution Order & Stage Gating

Checks are run in order. A failed pre-flight blocks higher checks:

```
1. Pre-flight checks (structural baseline)
   └─ fail → stop, report structural issues only

2. 1NF heuristics
   └─ independent of FDs, always runs if pre-flight passes

3. 2NF partial dependency check
   └─ requires composite PK + FDs; skips gracefully if missing

4. 3NF transitive dependency check
   └─ requires FDs; skips gracefully if missing
```

All checks run **only on the currently active stage**. No cross-stage validation is performed.

---

## 7. What Cannot Be Covered Algorithmically

These checks require semantic understanding or domain knowledge that a rule-based algorithm cannot provide. They remain as **manual checklist items** in the Check NF Rules modal, managed entirely by the student.

| Rule | Why It Cannot Be Automated |
|---|---|
| "All data for the domain is captured" | Requires knowledge of the problem domain — the algorithm has no reference for what entities should exist. |
| "Repeating groups are visible and documented" | Can detect naming patterns but cannot confirm whether the student has *documented* them intentionally. |
| "Attribute names are unambiguous within each table" | Two attributes named `date` in different tables are technically fine; semantic ambiguity requires domain context. |
| "Attribute values are atomic" (semantic) | Can heuristically flag names, but cannot inspect actual data values. A field named `email` storing `a,b,c` is undetectable without data. |
| "Schema is in 1NF (prerequisite)" | This is an umbrella statement requiring human judgment on the combined result of all 1NF checks. |
| "No partial dependencies exist (verified via FD annotations)" | The algorithm checks FDs that are drawn, but cannot verify that *all relevant FDs have been drawn*. Absent FDs are not absent dependencies. |
| "Tables have been decomposed to remove partial dependencies" | The algorithm detects violations; it cannot verify that decomposition was done correctly — only a human can judge structural intent. |
| "Schema is in 2NF (prerequisite)" | Same as above — umbrella judgment. |
| "No transitive dependencies (verified via FD annotations)" | Same caveat: only checks drawn FDs. Undrawn transitive chains are invisible. |
| "All transitive dependencies decomposed" | Cannot verify correctness of decomposition. |
| "FD annotations confirm no non-key attr determines another non-key attr" | This is the 3NF algorithm check — but the manual item remains as student's confirmation of completeness. |

---

## 8. UX: Violation Surfacing

### 8.1 Canvas Inline Indicators

| Target element | When shown | Icon |
|---|---|---|
| Table header | Missing PK, duplicate name, empty table | ❌ or ⚠️ |
| Attribute row (in table node) | 1NF naming heuristic triggered | ⚠️ |
| FD bracket / spine | Partial dependency (2NF) or transitive dep (3NF) | ❌ |

All icons show a tooltip on hover. Tooltips use plain language explaining the specific issue.

### 8.2 Check NF Rules Modal

The modal replaces the manual checkbox with an auto-detected status badge for rules the algorithm covers. Manual checkboxes remain only for rules the algorithm cannot check.

**Status badge values:**

| Badge | Meaning |
|---|---|
| ✅ Pass | Algorithm confirmed compliance |
| ❌ Error | Definitive violation detected |
| ⚠️ Warning | Heuristic/uncertain — student should review |
| — (grey) | Not applicable (e.g. 2NF check on single-column PK) |

**Key behavior:** A ⚠️ warning does **not** block the student from self-marking the rule as compliant. Warnings are advisory. A ❌ error indicates the algorithm is confident in the violation.

### 8.3 Confidence Levels

| Icon | Meaning | Examples |
|---|---|---|
| ❌ Error | Definitive — algorithm is certain | Missing PK, confirmed partial dep, confirmed transitive dep |
| ⚠️ Warning | Heuristic — algorithm suspects, student should verify | Plural attribute name, no FDs drawn, compound name |

---

## 9. Superpower Block — AI-Assisted Checks via OpenRouter

> **Status: Deferred.** This section documents how AI-based checks could extend the algorithm. Implementation is not planned for MVP.

### 9.1 Concept

For checks that require semantic understanding of attribute names, domain context, or dependency correctness, a call to an LLM via OpenRouter can supplement the rule-based algorithm. The AI check is always labeled `⚠️ AI suggestion` and never overrides a rule-based result.

The flow:
1. Student clicks **"Run Check"** → rule-based checks run immediately (synchronous).
2. If AI checks are enabled, a secondary async request is sent to OpenRouter.
3. AI results arrive and are appended to the modal as a separate "AI Analysis" section.
4. The student can expand the AI section to see detailed reasoning.

### 9.2 Which Checks Could Use AI

#### Check AI-1: Semantic atomicity of attribute names

**Problem:** The heuristic rule flags names like `address`, but a field called `notes` may also store composite text. Naming heuristics have false positives and miss semantic issues.

**Prompt example:**

```
You are reviewing a database schema for 1NF compliance. Evaluate each attribute name and classify it as:
- "atomic" — likely stores a single, indivisible value
- "suspect" — name suggests the field may store composite or multi-valued data
- "non-atomic" — very likely violates 1NF

Table: "Orders"
Attributes: order_id (INT), customer_name (VARCHAR), shipping_address (VARCHAR), product_list (VARCHAR), order_date (DATE)

For each attribute, respond in JSON:
[{ "name": "...", "classification": "atomic|suspect|non-atomic", "reason": "..." }]
```

**Expected use:** Supplement Rule 1NF-B. AI can catch `customer_name` (compound) or `shipping_address` (composite) even if they don't match the hardcoded keyword list.

---

#### Check AI-2: FD semantic plausibility

**Problem:** The algorithm trusts that drawn FDs are semantically correct. A student may draw `phone → city` (non-key→non-key) and mark it `full`, but the dependency is semantically questionable.

**Prompt example:**

```
You are a database design assistant reviewing functional dependencies drawn by a student.

Table: "Employees"
Primary key: employee_id
Attributes: employee_id (INT), department_id (INT), department_name (VARCHAR), salary (DECIMAL)

Student-drawn FDs:
- {employee_id} → {department_id, salary}  [type: full]
- {department_id} → {department_name}       [type: full]

Identify any FDs that likely represent transitive dependencies, partial dependencies, or are semantically implausible. Explain your reasoning.
Respond as JSON: [{ "fd": "...", "issue": "none|partial|transitive|implausible", "explanation": "..." }]
```

**Expected use:** Catch transitive dependencies the student drew but labeled incorrectly (e.g. labeled `full` when it is `transitive`).

---

#### Check AI-3: Domain completeness hint

**Problem:** "All data for the domain is captured" is entirely manual. AI can analyze the schema structure and attribute names to suggest potentially missing entities.

**Prompt example:**

```
A student is modeling a library management system. Their current schema has these tables:
- Books (book_id, title, author, isbn)
- Members (member_id, name, email)
- Loans (loan_id, book_id, member_id, loan_date)

Based on common library domain knowledge, are there any entities or attributes that are commonly present but appear to be missing? List up to 3 suggestions with brief explanations. Be concise and educational.
```

**Expected use:** Show as an informational hint in the 0NF checklist, not as a violation. Gives students a nudge without telling them the answer.

---

#### Check AI-4: PK quality assessment

**Problem:** A student may mark `name` as a PK. The algorithm cannot evaluate whether this is a good identifier.

**Prompt example:**

```
Review this table and its primary key choice. Is the chosen PK a reliable natural key, or should a surrogate key (e.g. an auto-increment ID) be preferred?

Table: "Students"
Attributes: student_name (VARCHAR) [PK], email (VARCHAR), enrollment_date (DATE)

Respond in JSON: { "pk_quality": "good|weak|poor", "reason": "...", "suggestion": "..." }
```

**Expected use:** Warning indicator on the table header if PK quality is `weak` or `poor`.

---

### 9.3 Integration Notes

- All AI prompts include the **full table context** (name, all attributes + types + PK flags) and the **relevant FDs** for that table.
- AI responses are always parsed as JSON. If parsing fails, the AI section shows: *"AI check unavailable — response could not be parsed."*
- AI results are displayed in a collapsible section below the rule-based results in the modal, clearly labeled: *"AI Analysis (experimental — review carefully)"*.
- AI checks do NOT modify rule-based ✅/❌ badges. They add a separate `AI:` badge column.
- Rate limiting: AI checks are batched (one request per table) and throttled to avoid excessive API usage.
