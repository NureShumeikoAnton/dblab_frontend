import { createPortal } from 'react-dom';
import './styles/CreateTableFromAttrModal.css';

const CreateTableFromAttrModal = ({ attrNames, sourceTableName, onConfirm, onClose }) => {
    const namesLabel = attrNames.length === 1
        ? <strong>{attrNames[0]}</strong>
        : <><strong>{attrNames.slice(0, -1).join(', ')}</strong> та <strong>{attrNames[attrNames.length - 1]}</strong></>;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal create-table-attr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <div>
                        <p className="modal__title">Нову таблицю створено</p>
                        <p className="modal__subtitle">
                            Зберегти {namesLabel} як FK у <strong>{sourceTableName}</strong>?
                            Це також створить зв'язок між двома таблицями.
                        </p>
                    </div>
                </div>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
                        Ні, дякую
                    </button>
                    <button type="button" className="modal__btn modal__btn--primary" onClick={() => onConfirm(true)}>
                        Так, позначити як FK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateTableFromAttrModal;
