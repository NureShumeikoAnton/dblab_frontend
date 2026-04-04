# API Requirements — Visual DB Schema Editor

All endpoints require `Authorization: <token>` header (raw JWT, not "Bearer ..." — see project auth convention).

Base URL: `VITE_API_BASE_URL` (see `src/config/api.js`)

---

## Projects

### List student's projects
```
GET /projects
Response: Project[]
```

### Create project
```
POST /projects
Body: { name: string, description?: string }
Response: Project
```

### Get project (with all nested data)
```
GET /projects/:projectId
Response: Project (includes stages, attributes)
```

### Update project metadata
```
PUT /projects/:projectId
Body: { name?: string, description?: string }
Response: Project
```

### Delete project
```
DELETE /projects/:projectId
Response: 204
```

---

## Stages

Stages are auto-created (4 per project) when a project is created. Not manually created or deleted.

### Save stage state (batch upsert)
The primary persistence endpoint. Sends the full current state of one stage.

```
PUT /projects/:projectId/stages/:stageId
Body: {
  layout: {
    [tableId: string]: { x: number, y: number }
  },
  tables: {
    id?: string,           // omit for new
    name: string,
    color: string,
    tableAttributes: {
      id?: string,
      attributeId: string,
      is_PK: boolean,
      is_FK: boolean,
      alias?: string,
      order: number
    }[]
  }[],
  relationships: {
    id?: string,
    table1Id: string,
    table2Id: string,
    type: string,
    color: string,
    cardinality_t1: string,
    cardinality_t2: string
  }[],
  fds: {
    id?: string,
    color: string,
    level: string,
    starts: { attributeId: string }[],
    ends: { attributeId: string }[]
  }[],
  violationChecks: boolean[]
}
Response: StageState (full saved state with generated IDs)
```

> Note: This is a replace-all for the stage. The backend should delete removed entities and upsert new/existing ones, identified by `id`. This avoids a cascade of individual PUT/DELETE calls on every save.

---

## Attributes (project-level pool)

### List attributes for a project
```
GET /projects/:projectId/attributes
Response: Attribute[]
```

### Create attribute
```
POST /projects/:projectId/attributes
Body: {
  name: string,
  data_type: string,
  introduced_at_stage_Id: string,   // stage ID (not index)
  retired_at_stage_Id?: string | null
}
Response: Attribute
```

### Update attribute
```
PUT /projects/:projectId/attributes/:attributeId
Body: {
  name?: string,
  data_type?: string,
  retired_at_stage_Id?: string | null
}
Response: Attribute
```

### Delete attribute
```
DELETE /projects/:projectId/attributes/:attributeId
Response: 204
```

---

## Violation Checklist

Stored per stage, not per project, since each stage has its own set of rules.

### Save checklist state for a stage
Already included in the stage batch save (`violationChecks` array). No separate endpoint needed.

---

## Data Shapes

### Project
```ts
{
  project_Id: string
  name: string
  description: string | null
  created_at: string        // ISO datetime
  user_Id: string
  stages: Stage[]
  attributes: Attribute[]
}
```

### Stage
```ts
{
  stage_Id: string
  form: "0NF" | "1NF" | "2NF" | "3NF"
  project_Id: string
  initialized: boolean      // false until student opens stage for first time
  layout: Record<string, { x: number; y: number }>
  tables: Table[]
  relationships: Relationship[]
  fds: FunctionalDependency[]
  violationChecks: boolean[]
}
```

### Table
```ts
{
  table_Id: string
  name: string
  color: string
  stage_Id: string
  tableAttributes: TableAttribute[]
}
```

### TableAttribute
```ts
{
  tableAttribute_Id: string
  table_Id: string
  attribute_Id: string
  is_PK: boolean
  is_FK: boolean
  alias: string | null
  order: number
}
```

### Attribute
```ts
{
  attribute_Id: string
  name: string
  data_type: string
  project_Id: string
  introduced_at_stage_Id: string
  retired_at_stage_Id: string | null
}
```

### Relationship
```ts
{
  relationship_Id: string
  table1_Id: string
  table2_Id: string
  type: "identifying" | "non-identifying" | "many-to-many"
  color: string
  cardinality_t1: string    // e.g. "1", "0..1", "1..*", "0..*"
  cardinality_t2: string
  stage_Id: string
}
```

### FunctionalDependency
```ts
{
  fd_Id: string
  color: string
  level: "partial" | "full" | "transitive"
  stage_Id: string
  starts: { FD_start_Id: string; attribute_Id: string }[]
  ends:   { FD_end_Id: string;   attribute_Id: string }[]
}
```

---

## Notes for Backend

1. **Stage batch save** is the most important endpoint. It should run in a transaction: delete all tables/relationships/FDs for the stage that are not present in the payload, upsert the rest.

2. **Attributes live at project level**, not stage level. Stage visibility is computed from `introduced_at_stage_Id` / `retired_at_stage_Id`.

3. **Stage `initialized` flag** should be set to `true` on first PUT to that stage.

4. **Project creation** should automatically create 4 Stage records (0NF, 1NF, 2NF, 3NF) with `initialized: false`.

5. **Authorization**: Only the owning student (`user_Id`) can read/write their own projects. Admins may read any project (for future review feature).

6. The `layout` field on Stage can be stored as a JSON column — it maps `table_Id` → `{x, y}` and does not need relational normalization.
