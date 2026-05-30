import { createPortal } from 'react-dom';
import './styles/UnusedAttrsWarningModal.css';

const UnusedAttrsWarningModal = ({ count, onClose }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal unused-attrs-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <p className="modal__title">Unplaced attributes</p>
                    <p className="modal__subtitle">
                        {count === 1
                            ? 'There is 1 attribute in the pool that has not been placed on the canvas.'
                            : `There are ${count} attributes in the pool that have not been placed on the canvas.`}
                        {' '}Place or delete all attributes before moving to the next stage.
                    </p>
                </div>
                <div className="modal__actions">
                    <button type="button" className="modal__btn modal__btn--primary" onClick={onClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UnusedAttrsWarningModal;
