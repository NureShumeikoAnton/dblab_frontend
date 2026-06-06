# API Specification — Actual Backend (Single Source of Truth)

> Supersedes `SPEC_API.md`. All frontend code must conform to this document.

---

## Conventions

- **Base URL:** `API_CONFIG.BASE_URL` (env `VITE_API_BASE_URL`, falls back to production)
- **Auth header:** `Authorization: Bearer <token>` — the middleware does `authHeader.split(' ')[1]`, so the `"Bearer "` prefix is **required**
- **Content-Type:** `application/json` on all mutating requests
- **IDs:** all primary keys are auto-increment integers. The backend exposes them as prefixed strings in GET responses (`"attr-5"`, `"tbl-3"`, etc.). The PUT payload uses sequential integers (see §PUT Content).

---

## Endpoints

### GET /project/getAll
List all projects.

**Response 200** — array of project objects (includes fields beyond the editor's concern; editor ignores extras).

---

### POST /project/create
Create a new project. Backend also creates 4 Stage rows automatically.

**Request body**
```json
{ "name": "My Project", "description": "Optional description" }
```

**Response 201** — raw Sequelize instance (project + Stages association).
```json
{
    "project_id": 42,
    "name": "My Project",
    "description": "Optional description",
    "Stages": [
        { "stage_id": 10, "form": "1NF", "project_id": 42 },
        { "stage_id": 11, "form": "FDs", "project_id": 42 },
        { "stage_id": 12, "form": "2NF", "project_id": 42 },
        { "stage_id": 13, "form": "3NF", "project_id": 42 }
    ]
}
```
> The editor does not use stage integer IDs from this response. Stage identity in the editor is always `"stage-{form.toLowerCase()}"` (e.g. `"stage-1nf"`).

---

### GET /project/:id
Load a project with all editor content.

**Response 200**
```json
{
    "project_Id": 42,
    "name": "My Project",
    "description": "Optional description",
    "creation_date": "2026-05-01T10:00:00.000Z",
    "attributePool": [
        {
            "id": "attr-1",
            "name": "book_id",
            "data_type": "INT",
            "introduced_at_stage_Id": "stage-1nf",
            "retired_at_stage_Id": null
        }
    ],
    "stages": [
        {
            "stageId": "stage-1nf",
            "form": "1NF",
            "tables": [
                {
                    "id": "tbl-1",
                    "name": "Books",
                    "color": "#4A90D9",
                    "tableAttributes": [
                        {
                            "id": "ta-1",
                            "attributeId": "attr-1",
                            "is_PK": true,
                            "is_FK": false,
                            "alias": null
                        }
                    ],
                    "fds": [
                        {
                            "id": "fd-1",
                            "color": "#F39C12",
                            "level": 1,
                            "type": null,
                            "tableId": "tbl-1",
                            "starts": [{ "id": "fds-1", "attributeId": "attr-1" }],
                            "ends":   [{ "id": "fde-1", "attributeId": "attr-2" }]
                        }
                    ]
                }
            ],
            "relationships": [
                {
                    "id": "rel-1",
                    "type": "non-identifying",
                    "color": "#9B59B6",
                    "cardinality_t1": "1",
                    "cardinality_t2": "0..*",
                    "table1Id": "tbl-1",
                    "table2Id": "tbl-2"
                }
            ]
        },
        { "stageId": "stage-fds", "form": "FDs", "tables": [], "relationships": [] },
        { "stageId": "stage-2nf", "form": "2NF", "tables": [], "relationships": [] },
        { "stageId": "stage-3nf", "form": "3NF", "tables": [], "relationships": [] }
    ]
}
```

> **Critical structural note:** `fds` are nested **inside each `table` object**, NOT at the stage level.
> The deserializer must lift them from `stage.tables[i].fds` into a flat `stage.fds` array.

> `tableAttribute.order` is absent from the response — the deserializer derives it from array index.

> `fd.type` is `null`/`undefined` — the `FunctionalDependency` DB table has no `type` column
> (see Known Limitations §1). The `fd_stage` table exists but is not written or read by these endpoints.

---

### PUT /project/:id
Update project metadata — name and description only.

**Request body**
```json
{ "name": "Updated Name", "description": "Updated description" }
```

**Response 200** — `{ message: "Project updated successfully", project: { ... } }`

---

### PUT /project/updateProjectFull/:id
Save the full project content snapshot. **Full replace** — backend destroys all Stages (cascade) then re-inserts.

**⚠ ID strategy:** The backend uses **sequential 1-based integers** as cross-reference keys within a single save transaction. The frontend serializer must:
1. Number `attributePool` items 1…N and use those integers as `attribute_id` everywhere.
2. Number `tables` globally across all stages (stage0.table0 = 1, stage0.table1 = 2, stage1.table0 = 3, …) and use those integers as `table1_id`, `table2_id`, `table_id`.
3. Map `introduced_at_stage_Id` string (`"stage-1nf"`) to a 1-based stage index (1, 2, 3, 4).

**Field names differ from GET response** — see table below.

| Store field | PUT field |
|---|---|
| `color` | `colour` |
| `is_PK` | `ispk` |
| `is_FK` | `isfk` |
| `alias` | `pseudonim` |
| `cardinality_t1` | `cardinal1` |
| `cardinality_t2` | `cardinal2` |
| `table1Id` (UUID) | `table1_id` (integer index) |
| `table2Id` (UUID) | `table2_id` (integer index) |
| `tableId` (UUID) | `table_id` (integer index) |
| `attributeId` (UUID) | `attribute_id` (integer) |

**Request body**
```json
{
    "attributePool": [
        { "attribute_id": 1, "name": "book_id",  "data_type": "INT",     "introduced_at_stage_id": 1 },
        { "attribute_id": 2, "name": "title",    "data_type": "VARCHAR",  "introduced_at_stage_id": 1 },
        { "attribute_id": 3, "name": "member_id","data_type": "INT",     "introduced_at_stage_id": 1 },
        { "attribute_id": 4, "name": "loan_date","data_type": "DATE",    "introduced_at_stage_id": 1 }
    ],
    "stages": [
        {
            "form": "1NF",
            "tables": [
                {
                    "name": "Books",
                    "colour": "#4A90D9",
                    "tableAttributes": [
                        { "attribute_id": 1, "ispk": true,  "isfk": false, "pseudonim": null },
                        { "attribute_id": 2, "ispk": false, "isfk": false, "pseudonim": "Book Title" }
                    ]
                },
                {
                    "name": "Loans",
                    "colour": "#E74C3C",
                    "tableAttributes": [
                        { "attribute_id": 1, "ispk": true,  "isfk": true,  "pseudonim": null },
                        { "attribute_id": 3, "ispk": true,  "isfk": true,  "pseudonim": null },
                        { "attribute_id": 4, "ispk": false, "isfk": false, "pseudonim": null }
                    ]
                }
            ],
            "relationships": [
                {
                    "type": "non-identifying",
                    "colour": "#9B59B6",
                    "cardinal1": "1",
                    "cardinal2": "0..*",
                    "table1_id": 1,
                    "table2_id": 2
                }
            ],
            "fds": [
                {
                    "colour": "#F39C12",
                    "level": 1,
                    "type": "full",
                    "table_id": 2,
                    "starts": [{ "attribute_id": 1 }, { "attribute_id": 3 }],
                    "ends":   [{ "attribute_id": 4 }]
                }
            ]
        },
        { "form": "FDs",  "tables": [], "relationships": [], "fds": [] },
        { "form": "2NF",  "tables": [], "relationships": [], "fds": [] },
        { "form": "3NF",  "tables": [], "relationships": [], "fds": [] }
    ]
}
```

**Response 200** — `{ message: "Success" }`

**Response 4xx/5xx** — frontend shows "Autosave failed — click Save to retry".

---

### DELETE /project/delete/:id
Delete project and all related data.

**Response 200** — `{ message: "Project deleted successfully" }`

---

## Known Limitations

| # | Limitation | Root cause |
|---|---|---|
| 1 | **FD `type`** (`partial`/`full`/`transitive`) is not persisted | `FunctionalDependency` model has no `type` column; `fd_stage` table exists but `updateProjectFull` does not write to it and `getById` does not join it |
| 2 | **`retired_at_stage_Id`** is always `null` after reload | `Attribute` DB model has no retirement column; accepted data loss |
| 3 | **Table/attribute DB IDs drift upward** across save cycles | Delete-then-insert with auto-increment; frontend always reloads from API after navigation |

---

## Frontend Deserialization Notes

When loading `GET /project/:id` into the editor store:

1. `stage.tables[i].fds` → flatten into `stage.fds` (keyed by `fd.tableId` which is already correct)
2. `tableAttribute.order` → derive from array index (`order: index`)
3. `table.position` → set to `{ x: 0, y: 0 }` as placeholder; override from `localStorage` via `loadLocalState()`
4. `stage.violationChecks` → set to `[]`; override from `localStorage`
5. `stage.initialized` → derive as `tables.length > 0`
6. `fd.type` → default to `null` if `undefined`
