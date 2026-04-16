import React, { useState } from 'react';

const ComplexityDots = ({ levelStr }) => {
    let filled = 3;
    let color = '#FF9800'; 

    if (levelStr) {
        const s = levelStr.toLowerCase();
        if (s.includes('низька') || s.includes('low')) {
            filled = 1; color = '#4CAF50';
        } else if (s.includes('висока') || s.includes('high')) {
            filled = 5; color = '#F44336';
        }
    }

    return (
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '10px' }} title={`Складність: ${levelStr || 'Середня'}`}>
            <span style={{ fontSize: '0.8rem', color: '#888', marginRight: '5px', fontWeight: 400 }}>Складність:</span>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: i <= filled ? color : '#E0E0E0',
                    transition: 'background-color 0.3s'
                }} />
            ))}
        </div>
    );
};

export default ComplexityDots;