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
                        <p className="modal__title">Видалити "{tableName}"?</p>
                        <p className="modal__subtitle">
                            Наступні ФЗ посилаються на атрибути цієї таблиці.
                            Зберегти їх як осиротілі або видалити разом з таблицею?
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
                        Скасувати
                    </button>
                    <button type="button" className="modal__btn modal__btn--primary" onClick={onSave}>
                        Зберегти ФЗ
                    </button>
                    <button type="button" className="modal__btn modal__btn--danger" onClick={onDeleteAll}>
                        Видалити все
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteTableModal;
