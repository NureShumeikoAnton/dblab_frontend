import React, { useState } from 'react';
import './styles/Tooltip.css';

const Tooltip = ({ text, children }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} 
             onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    background: '#333', color: '#fff', padding: '5px 10px', borderRadius: '4px',
                    fontSize: '12px', whiteSpace: 'nowrap', zIndex: 100, marginBottom: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    {text}
                    <div style={{
                        position: 'absolute', top: '100%', left: '50%', marginLeft: '-5px',
                        borderWidth: '5px', borderStyle: 'solid', borderColor: '#333 transparent transparent transparent'
                    }}></div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;