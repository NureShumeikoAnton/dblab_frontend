import { createPortal } from 'react-dom';
import './styles/DeleteTableModal.css';

const formatFD = (fd, attrMap) => {
    const names = (ids) => ids
        .map((s) => attrMap.get(s.attributeId)?.name ?? '?')
        .join(', ');
    return `${names(fd.starts)} → ${names(fd.ends)}`;
};

const DeleteTableModal = ({ tableName, fds, attrMap, onSave, onDeleteAll, onCancel }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal delete-table-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <div>
                        <p className="modal__title">Delete "{tableName}"?</p>
                        <p className="modal__subtitle">
                            The following FDs reference attributes in this table.
                            Save them as orphaned or delete them together with the table?
                        </p>
                    </div>
                </div>
                <ul className="delete-table-modal__fd-list">
                    {fds.map((fd) => (
                        <li key={fd.id} className="delete-table-modal__fd-item">
                            {formatFD(fd, attrMap)}
                        </li>
                    ))}
                </ul>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="modal__btn modal__btn--primary" onClick={onSave}>
                        Save FDs
                    </button>
                    <button type="button" className="modal__btn modal__btn--danger" onClick={onDeleteAll}>
                        Delete all
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteTableModal;
