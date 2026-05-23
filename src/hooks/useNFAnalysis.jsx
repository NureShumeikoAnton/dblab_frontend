import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import useEditorStore from '../store/editorStore.js';
import { runNFChecks } from '../utils/normalizationAlgorithm.js';

export const NFAnalysisContext = createContext(null);

export function NFAnalysisProvider({ stageIndex, children }) {
    const tables = useEditorStore((s) => s.stages[stageIndex]?.tables ?? []);
    const fds = useEditorStore((s) => s.stages[stageIndex]?.fds ?? []);
    const pool = useEditorStore((s) => s.attributePool);

    // Keep refs in sync so triggerCheck always reads the latest data.
    const tablesRef = useRef(tables);
    const fdsRef = useRef(fds);
    const poolRef = useRef(pool);
    useEffect(() => { tablesRef.current = tables; }, [tables]);
    useEffect(() => { fdsRef.current = fds; }, [fds]);
    useEffect(() => { poolRef.current = pool; }, [pool]);

    const [snapshot, setSnapshot] = useState(null);

    const triggerCheck = useCallback(() => {
        setSnapshot(runNFChecks(tablesRef.current, fdsRef.current, poolRef.current));
    }, []);

    return (
        <NFAnalysisContext.Provider value={{ snapshot, triggerCheck }}>
            {children}
        </NFAnalysisContext.Provider>
    );
}

/** Returns the last committed analysis snapshot (null until "Check NF Rules" is clicked). */
export function useNFAnalysis() {
    return useContext(NFAnalysisContext)?.snapshot ?? null;
}

/** Returns the function that runs a fresh NF check and stores the snapshot. */
export function useNFAnalysisTrigger() {
    return useContext(NFAnalysisContext)?.triggerCheck ?? null;
}
