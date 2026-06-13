import { createPortal } from 'react-dom';
import './styles/ConfirmResetModal.css';

const ConfirmResetModal = ({ stageLabel, onConfirm, onCancel }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal confirm-reset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <p className="modal__title">Скинути етап {stageLabel}?</p>
                    <p className="modal__subtitle">
                        Усі таблиці, функціональні залежності та зв'язки на цьому етапі будуть видалені назавжди.
                        Вам буде запропоновано повторно ініціалізувати етап.
                    </p>
                </div>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--secondary" onClick={onCancel}>
                        Скасувати
                    </button>
                    <button type="button" className="modal__btn modal__btn--danger" onClick={onConfirm}>
                        Скинути етап
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmResetModal;
