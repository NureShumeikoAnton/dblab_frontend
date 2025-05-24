import React, { useState, forwardRef, useImperativeHandle } from 'react';
import './styles/ModalNotification.css';

const ModalNotificationComponent = forwardRef((props, ref) => {
    const [notifications, setNotifications] = useState([]);
    
    const addNotification = ({ title, text, type = 'success' }) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, text, type }]);
        console.log(`Notification added: ${title}, ${text}, ${type}`);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3500);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useImperativeHandle(ref, () => ({
        addNotification
    }));

    return (
        <div className="modal-notification-container">
            {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notification ${n.type === 'error' ? 'notification--error' : 'notification--success'}`}
                  onClick={() => removeNotification(n.id)}
                >
                    <strong>{n.title}</strong>
                    <p>{n.text}</p>
                </div>
            ))}
        </div>
    );
});

export default ModalNotificationComponent;
