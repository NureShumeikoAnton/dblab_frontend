# Rollback: NF Analysis — on-demand check only

**Change summary:** NF analysis results (canvas highlights on `TableNode` and `FDEdge`) are now frozen until the user clicks "Check NF Rules". Previously the analysis ran live on every store change.

---

## Files changed

### 1. `src/hooks/useNFAnalysis.jsx`

**Before:** `NFAnalysisProvider` ran `runNFChecks` reactively via `useMemo` and passed the result directly as context value. `useNFAnalysis()` returned live analysis.

**After:** Provider holds a `snapshot` state (initially `null`). `triggerCheck` callback computes the analysis on demand via refs. Added `useNFAnalysisTrigger()` export. Context value changed from `analysis` object to `{ snapshot, triggerCheck }`.

**To revert — replace entire file with:**
```jsx
import { createContext, useContext, useMemo } from 'react';
import useEditorStore from '../store/editorStore.js';
import { runNFChecks } from '../utils/normalizationAlgorithm.js';

export const NFAnalysisContext = createContext(null);

export function NFAnalysisProvider({ stageIndex, children }) {
    const tables = useEditorStore((s) => s.stages[stageIndex]?.tables ?? []);
    const fds = useEditorStore((s) => s.stages[stageIndex]?.fds ?? []);
    const pool = useEditorStore((s) => s.attributePool);

    const analysis = useMemo(
        () => runNFChecks(tables, fds, pool),
        [tables, fds, pool]
    );

    return (
        <NFAnalysisContext.Provider value={analysis}>
            {children}
        </NFAnalysisContext.Provider>
    );
}

export function useNFAnalysis() {
    return useContext(NFAnalysisContext);
}
```

---

### 2. `src/components/StageBar.jsx`

**Before:** Imported only `useNFAnalysis`. Button `onClick` was `() => setShowChecklist((v) => !v)`.

**After:** Also imports `useNFAnalysisTrigger`. Button `onClick` calls `triggerCheck?.()` before opening the modal.

**To revert — three hunks:**

1. Import line — change back to:
```jsx
import { useNFAnalysis } from '../hooks/useNFAnalysis.jsx';
```

2. Remove the `triggerCheck` line from the component body:
```jsx
const triggerCheck = useNFAnalysisTrigger();
```

3. Button `onClick` — change back to:
```jsx
onClick={() => setShowChecklist((v) => !v)}
```

---

### 3. `src/pages/EditorPage.jsx`

**Before:** `<NFAnalysisProvider stageIndex={currentStageIndex}>`

**After:** `<NFAnalysisProvider key={currentStageIndex} stageIndex={currentStageIndex}>`

**To revert:** Remove `key={currentStageIndex}` from the `NFAnalysisProvider` JSX element.
