import useEditorStore from '../store/editorStore.js';
import './styles/TableNode.css';

const TableNode = ({ data }) => {
    const { table } = data;
    const attributePool = useEditorStore((s) => s.attributePool);

    const sorted = [...table.tableAttributes].sort((a, b) => a.order - b.order);

    return (
        <div className="table-node">
            <div
                className="table-node__header"
                style={{ borderLeftColor: table.color }}
            >
                <span className="table-node__name">{table.name}</span>
            </div>
            <div className="table-node__body">
                {sorted.map((ta) => {
                    const attr = attributePool.find((a) => a.id === ta.attributeId);
                    if (!attr) return null;
                    const displayName = ta.alias ?? attr.name;
                    return (
                        <div
                            key={ta.id}
                            className={`table-node__row${ta.is_PK ? ' table-node__row--pk' : ''}`}
                        >
                            <div className="table-node__key-col">
                                {ta.is_PK && <span className="table-node__badge table-node__badge--pk">PK</span>}
                                {ta.is_FK && !ta.is_PK && <span className="table-node__badge table-node__badge--fk">FK</span>}
                            </div>
                            <span className="table-node__attr-name">{displayName}</span>
                            <span className="table-node__attr-type">{attr.data_type}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TableNode;
