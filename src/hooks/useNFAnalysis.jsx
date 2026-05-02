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
