import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './styles/RelationshipContextMenu.css';

const RelationshipContextMenu = ({ x, y, onDelete, onClose }) => {
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
        <ul ref={menuRef} className="rel-ctx-menu" style={{ top: y, left: x }}>
            <li
                className="rel-ctx-menu__item rel-ctx-menu__item--danger"
                onClick={() => { onDelete(); onClose(); }}
            >
                🗑&nbsp; Delete relationship
            </li>
        </ul>,
        document.body
    );
};

export default RelationshipContextMenu;
