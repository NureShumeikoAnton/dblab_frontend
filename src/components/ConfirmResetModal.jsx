import { createPortal } from 'react-dom';
import './styles/ConfirmResetModal.css';

const ConfirmResetModal = ({ stageLabel, onConfirm, onCancel }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal confirm-reset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <p className="modal__title">Reset {stageLabel} stage?</p>
                    <p className="modal__subtitle">
                        All tables, functional dependencies, and relationships in this stage will be permanently deleted.
                        You will be prompted to re-initialize the stage.
                    </p>
                </div>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="modal__btn modal__btn--danger" onClick={onConfirm}>
                        Reset stage
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmResetModal;
