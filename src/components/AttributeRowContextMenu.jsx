import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './styles/AttributeRowContextMenu.css';

const AttributeRowContextMenu = ({ x, y, onRemove, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('click', handleOutsideClick, { capture: true });
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleOutsideClick, { capture: true });
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <ul ref={menuRef} className="attr-row-ctx-menu" style={{ top: y, left: x }}>
            <li
                className="attr-row-ctx-menu__item attr-row-ctx-menu__item--danger"
                onClick={() => { onRemove(); onClose(); }}
            >
                🗑&nbsp; Remove from table
            </li>
        </ul>,
        document.body
    );
};

export default AttributeRowContextMenu;
