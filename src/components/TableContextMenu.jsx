import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './styles/TableContextMenu.css';

const TableContextMenu = ({ x, y, hasPK, onAddRelationship, onDelete, onClose }) => {
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
        <ul ref={menuRef} className="table-ctx-menu" style={{ top: y, left: x }}>
            <li
                className={`table-ctx-menu__item${hasPK ? '' : ' table-ctx-menu__item--disabled'}`}
                onClick={hasPK ? () => { onAddRelationship(); onClose(); } : undefined}
            >
                🔗&nbsp; Додати зв'язок до...
            </li>
            <li
                className="table-ctx-menu__item table-ctx-menu__item--danger"
                onClick={() => { onDelete(); onClose(); }}
            >
                🗑&nbsp; Видалити таблицю
            </li>
        </ul>,
        document.body
    );
};

export default TableContextMenu;
