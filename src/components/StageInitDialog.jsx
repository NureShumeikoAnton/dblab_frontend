import './styles/StageInitDialog.css';

const StageInitDialog = ({ stageLabel, prevStageLabel, onStartEmpty, onCopyFromPrevious }) => {
    return (
        <div className="modal-overlay">
            <div className="modal stage-init-dialog">
                <div className="modal__header">
                    <div>
                        <h2 className="modal__title">Ініціалізувати етап {stageLabel}</h2>
                        <p className="modal__subtitle">Як ви хочете розпочати?</p>
                    </div>
                </div>
                <div className="stage-init-dialog__actions">
                    <button
                        className="stage-init-dialog__btn stage-init-dialog__btn--secondary"
                        onClick={onStartEmpty}
                    >
                        Почати порожнім
                    </button>
                    {prevStageLabel && (
                        <button
                            className="stage-init-dialog__btn stage-init-dialog__btn--primary"
                            onClick={onCopyFromPrevious}
                        >
                            Скопіювати з {prevStageLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StageInitDialog;
