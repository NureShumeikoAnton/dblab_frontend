# API Specification — Visual DB Schema Editor

## Conventions

- **Base URL:** configured in `src/config/api.js` → `API_CONFIG.BASE_URL`
- **Auth header:** raw token in `Authorization` (no `"Bearer "` prefix — existing project convention)
- **Content-Type:** `application/json` on all mutating requests
- **IDs:** string UUIDs generated on the frontend; the backend stores them as-is

---

## Project Endpoints

These endpoints manage only the project row itself (name + description).
They are independent of stage/table/attribute data.

---

### GET /projects
List all projects for the authenticated user.

**Response 200**
```json
[
    {
        "id": "proj-1",
        "name": "Library Management",
        "description": "Practice project for 2NF normalization",
        "created_at": "2026-05-01T10:00:00Z"
    },
    {
        "id": "proj-2",
        "name": "E-Commerce Schema",
        "description": "",
        "created_at": "2026-05-15T08:30:00Z"
    }
]
```

---

### POST /projects
Create a new project. The backend also creates the 4 stage rows automatically.

**Request body**
```json
{
    "name": "Library Management",
    "description": "Practice project for 2NF normalization"
}
```

**Response 201**
```json
{
    "id": "proj-1",
    "name": "Library Management",
    "description": "Practice project for 2NF normalization",
    "created_at": "2026-05-23T10:00:00Z",
    "stages": [
        { "stageId": "stage-1nf", "form": "1NF" },
        { "stageId": "stage-fds", "form": "FDs" },
        { "stageId": "stage-2nf", "form": "2NF" },
        { "stageId": "stage-3nf", "form": "3NF" }
    ]
}
```

> The frontend needs the `stageId` values from this response to link subsequent
> content saves correctly. Store them in `store.stages[i].stageId`.

---

### PUT /projects/:projectId
Update project metadata — name and description only.
Called when the user edits the project name inline in the editor toolbar (on blur / debounce).

**Request body**
```json
{
    "name": "Library Management System",
    "description": "Updated description — covers Books, Members, Loans tables"
}
```

**Response 200**
```json
{
    "id": "proj-1",
    "name": "Library Management System",
    "description": "Updated description — covers Books, Members, Loans tables",
    "created_at": "2026-05-23T10:00:00Z"
}
```

---

### DELETE /projects/:projectId
Delete a project and all related data (cascade on the backend side).

**Response 204** — no body

---

## Project Content Endpoint

This is the heavy endpoint — it replaces all stage/table/attribute/FD/relationship data
for a project in one atomic operation. The backend deserializes and upserts all entities.

**Frontend-only fields NOT included in this payload** (see also `SPEC.md §18`):

| Excluded field | Why |
|---|---|
| `table.position` | Canvas coords — saved to `localStorage` only |
| `tableAttribute.order` | Reconstructed from array index position |
| `stage.initialized` | Derived from `tables.length > 0` at load time |
| `stage.violationChecks` | Saved to `localStorage` only |
| `ui.*` | Session-only state, never persisted |

---

### GET /projects/:projectId/content
Load full project content into the editor.

**Response 200** — same shape as the PUT request body below, with the addition that the
backend may include any fields it owns (e.g. audit timestamps) which the frontend ignores.

---

### PUT /projects/:projectId/content
Save the full project content snapshot.
Called by the **Save button** and by the **30-second autosave**.

**Request body**
```json
{
    "attributePool": [
        {
            "id": "attr-1",
            "name": "book_id",
            "data_type": "INT",
            "introduced_at_stage_Id": "stage-1nf",
            "retired_at_stage_Id": null
        },
        {
            "id": "attr-2",
            "name": "title",
            "data_type": "VARCHAR",
            "introduced_at_stage_Id": "stage-1nf",
            "retired_at_stage_Id": null
        },
        {
            "id": "attr-3",
            "name": "member_id",
            "data_type": "INT",
            "introduced_at_stage_Id": "stage-1nf",
            "retired_at_stage_Id": null
        },
        {
            "id": "attr-4",
            "name": "loan_date",
            "data_type": "DATE",
            "introduced_at_stage_Id": "stage-1nf",
            "retired_at_stage_Id": null
        },
        {
            "id": "attr-5",
            "name": "author_id",
            "data_type": "INT",
            "introduced_at_stage_Id": "stage-2nf",
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
                        },
                        {
                            "id": "ta-2",
                            "attributeId": "attr-2",
                            "is_PK": false,
                            "is_FK": false,
                            "alias": "Book Title"
                        }
                    ]
                },
                {
                    "id": "tbl-2",
                    "name": "Loans",
                    "color": "#E74C3C",
                    "tableAttributes": [
                        {
                            "id": "ta-3",
                            "attributeId": "attr-1",
                            "is_PK": true,
                            "is_FK": true,
                            "alias": null
                        },
                        {
                            "id": "ta-4",
                            "attributeId": "attr-3",
                            "is_PK": true,
                            "is_FK": true,
                            "alias": null
                        },
                        {
                            "id": "ta-5",
                            "attributeId": "attr-4",
                            "is_PK": false,
                            "is_FK": false,
                            "alias": null
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
            ],
            "fds": [
                {
                    "id": "fd-1",
                    "color": "#F39C12",
                    "level": 1,
                    "type": "full",
                    "tableId": "tbl-2",
                    "starts": [
                        { "id": "fds-1", "attributeId": "attr-1" },
                        { "id": "fds-2", "attributeId": "attr-3" }
                    ],
                    "ends": [
                        { "id": "fde-1", "attributeId": "attr-4" }
                    ]
                }
            ]
        },
        {
            "stageId": "stage-fds",
            "form": "FDs",
            "tables": [],
            "relationships": [],
            "fds": []
        },
        {
            "stageId": "stage-2nf",
            "form": "2NF",
            "tables": [
                {
                    "id": "tbl-3",
                    "name": "Books",
                    "color": "#4A90D9",
                    "tableAttributes": [
                        {
                            "id": "ta-6",
                            "attributeId": "attr-1",
                            "is_PK": true,
                            "is_FK": false,
                            "alias": null
                        },
                        {
                            "id": "ta-7",
                            "attributeId": "attr-2",
                            "is_PK": false,
                            "is_FK": false,
                            "alias": null
                        },
                        {
                            "id": "ta-8",
                            "attributeId": "attr-5",
                            "is_PK": false,
                            "is_FK": true,
                            "alias": null
                        }
                    ]
                }
            ],
            "relationships": [],
            "fds": []
        },
        {
            "stageId": "stage-3nf",
            "form": "3NF",
            "tables": [],
            "relationships": [],
            "fds": []
        }
    ]
}
```

**Response 200** — no specific body required; a confirmation object is fine:
```json
{ "ok": true }
```

**Response 4xx/5xx** — the frontend shows "Autosave failed — click Save to retry" in the toolbar.

---

## Notes for the Backend Team

1. **Upsert semantics** — `PUT /projects/:projectId/content` is a full snapshot replace.
   The simplest implementation: delete all existing `Table`, `Attribute`, `Table_Attribute`,
   `Relationship`, `FunctionalDependency`, `FD_Stage`, `FD_Start`, `FD_End` rows for
   this project, then insert the full payload. IDs are stable across saves, so a
   delete-then-insert strategy is safe.

2. **`tableAttribute` order** — the `tableAttributes` array inside each table is pre-sorted
   by display order (ascending). Reconstruct the `order` integer from array index at load time
   (index 0 = order 0, etc.).

3. **`stage.initialized`** — not in the payload. Derive at load time as `tables.length > 0`.

4. **`fd.tableId`** — maps to `table_Id` on `FD_Stage` (see `SPEC.md §19` for the design
   rationale). This field disambiguates which table a functional dependency bracket belongs to
   when the same attribute appears in multiple tables within a stage.

5. **`stage.violationChecks`** — not in the payload. The frontend persists these in
   `localStorage` only. No backend storage is needed.

6. **Attribute `retired_at_stage_Id`** — `null` means the attribute is active in all stages
   from `introduced_at_stage_Id` onward. A non-null value is a `stageId` string.
