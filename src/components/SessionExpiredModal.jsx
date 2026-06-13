import React from 'react';
import './styles/SessionExpiredModal.css';

const SessionExpiredModal = ({ onLogin, onContinue }) => (
    <div className="sem-overlay">
        <div className="sem-modal" role="dialog" aria-modal="true" aria-labelledby="sem-title">
            <div className="sem-modal__strip" />
            <div className="sem-modal__inner">
                <h2 className="sem-modal__title" id="sem-title">Сесію завершено</h2>
                <p className="sem-modal__text">
                    Час вашої сесії вичерпано, тому зміни більше не можуть бути збережені
                    на сервері. Ваша робота продовжує зберігатися локально в цьому
                    браузері та синхронізується після повторного входу.
                </p>
                <div className="sem-actions">
                    <button type="button" className="sem-btn sem-btn--ghost" onClick={onContinue}>
                        Продовжити роботу офлайн
                    </button>
                    <button type="button" className="sem-btn sem-btn--primary" onClick={onLogin}>
                        Увійти знову
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default SessionExpiredModal;
