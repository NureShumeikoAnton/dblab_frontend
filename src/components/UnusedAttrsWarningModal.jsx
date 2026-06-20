import { createPortal } from 'react-dom';
import './styles/UnusedAttrsWarningModal.css';

const UnusedAttrsWarningModal = ({ count, onClose }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal unused-attrs-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <p className="modal__title">Нерозміщені атрибути</p>
                    <p className="modal__subtitle">
                        {count === 1
                            ? 'В пулі є 1 атрибут, який не було розміщено на полотні.'
                            : `В пулі є ${count} атрибути(-ів), що не були розміщені на полотні.`}
                        {' '}Розмістіть або видаліть усі атрибути перед переходом до наступного етапу.
                    </p>
                </div>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--primary" onClick={onClose}>
                        Зрозуміло
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnusedAttrsWarningModal;
