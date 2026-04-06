# Database Schema Reference

This file is the **source of truth** for the backend data model.
The frontend store mirrors this shape with minor additions noted below.

---

## Entities

### User
| Column | Type | Notes |
|---|---|---|
| user_Id | PK | |
| nickname | | |
| email | | |
| login | | |
| password | | |
| role | | Determines student vs admin access |

Relations: one-to-many with **Project**

---

### Project
| Column | Type | Notes |
|---|---|---|
| project_Id | PK | |
| name | | |
| description | | |
| created_at | | |
| user_Id | FK → User | |

Relations: one-to-many with **Stage**

---

### Stage
| Column | Type | Notes |
|---|---|---|
| stage_Id | PK | |
| form | | `'0NF'` \| `'1NF'` \| `'2NF'` \| `'3NF'` |
| project_Id | FK → Project | |

Relations: one-to-many with **Table**, **Attribute**, **FD_Stage**

---

### Table
| Column | Type | Notes |
|---|---|---|
| table_Id | PK | |
| name | | |
| color | | Hex string, e.g. `'#4A90D9'` |
| stage_Id | FK → Stage | |

Relations: one-to-many with **Relationship**, **Table_Attribute**

> **Frontend-only field:** `position: { x, y }` — canvas coordinates, serialized
> separately in a layout JSON field. Not in the DB table.

---

### Relationship
| Column | Type | Notes |
|---|---|---|
| relationship_Id | PK | |
| type | | `'identifying'` \| `'non-identifying'` \| `'many-to-many'` |
| color | | Hex string |
| cardinality_t1 | | `'1'` \| `'0..1'` \| `'1..*'` \| `'0..*'` |
| cardinality_t2 | | same options |
| table1_Id | FK → Table | |
| table2_Id | FK → Table | |

---

### Attribute
| Column | Type | Notes |
|---|---|---|
| attribute_Id | PK | |
| name | | |
| data_type | | `INT` \| `VARCHAR` \| `TEXT` \| `DATE` \| `BOOLEAN` \| `DECIMAL` \| `TIMESTAMP` \| `UUID` |
| introduced_at_stage_Id | FK → Stage | First stage where the attribute is available |
| retired_at_stage_Id | FK → Stage | NULL = active in all later stages |

Relations: one-to-many with **Table_Attribute**, **FD_Start**, **FD_End**

---

### Table_Attribute
| Column | Type | Notes |
|---|---|---|
| tableAttribute_Id | PK | |
| is_PK | boolean | |
| is_FK | boolean | |
| alias | string \| null | Optional display name override |
| table_Id | FK → Table | |
| attribute_Id | FK → Attribute | |

> **Frontend-only field:** `order` (integer) — display sort order within a table.
> Derived from array index position; not persisted to DB.

---

### FunctionalDependency
| Column | Type | Notes |
|---|---|---|
| fd_Id | PK | |
| color | | Hex string |
| level | integer | Bracket lane: positive = left side, negative = right side. Absolute value = stacking distance (1 = nearest, 2 = next out, …) |

Relations: one-to-many with **FD_Stage**, **FD_Start**, **FD_End**

> FDs are project-level entities. They connect to specific stages via **FD_Stage**.

---

### FD_Stage
| Column | Type | Notes |
|---|---|---|
| fd_stage_Id | PK | |
| type | | `'partial'` \| `'full'` \| `'transitive'` — the dependency classification for this stage |
| fd_Id | FK → FunctionalDependency | |
| stage_Id | FK → Stage | |

> **Frontend representation:** The per-stage `fds` array in the store is a
> denormalized join of `FunctionalDependency` + `FD_Stage`. Each item carries
> both `color`/`level` (from FD) and `type` (from FD_Stage).

---

### FD_Start
| Column | Type | Notes |
|---|---|---|
| FD_start_Id | PK | |
| FD_Id | FK → FunctionalDependency | |
| attribute_Id | FK → Attribute | Determinant attribute |

---

### FD_End
| Column | Type | Notes |
|---|---|---|
| FD_end_Id | PK | |
| FD_Id | FK → FunctionalDependency | |
| attribute_Id | FK → Attribute | Dependent attribute |

---

## Frontend Store Mapping

```
DB entity                   →  Store location
────────────────────────────────────────────────────────────────────
Project                     →  store.project
Stage                       →  store.stages[0..3]
Table                       →  store.stages[i].tables[]
  + position {x,y}             (frontend-only, canvas coords)
Relationship                →  store.stages[i].relationships[]
Attribute                   →  store.attributePool[]
Table_Attribute             →  store.stages[i].tables[j].tableAttributes[]
  + order                      (frontend-only, display sort index)
FunctionalDependency        →  store.stages[i].fds[]  (denormalized with FD_Stage)
  FD.color, FD.level           ↘  merged into one object per stage FD entry
  FD_Stage.type                ↗
FD_Start                    →  store.stages[i].fds[k].starts[]
FD_End                      →  store.stages[i].fds[k].ends[]
```

### Store FD object shape
```js
{
    id,           // fd_Id (FunctionalDependency)
    color,        // FD.color
    level,        // FD.level — integer (positive=left bracket, negative=right)
    type,         // FD_Stage.type — 'partial' | 'full' | 'transitive'
    starts: [{ id, attributeId }],   // FD_Start records
    ends:   [{ id, attributeId }],   // FD_End records
}
```
