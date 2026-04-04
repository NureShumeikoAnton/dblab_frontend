import React from 'react';
import AttributeItem from './AttributeItem.jsx';
import './styles/AttributePanel.css';

const AttributePanel = ({ attributes }) => {
    return (
        <div className="attribute-panel">
            <div className="attribute-panel__header">
                <span className="attribute-panel__title">Attributes</span>
            </div>
            <div className="attribute-panel__actions">
                <button className="attribute-panel__btn" disabled>
                    + Add to this stage
                </button>
                <button className="attribute-panel__btn" disabled>
                    + Add global
                </button>
            </div>
            <div className="attribute-panel__list">
                {attributes.length === 0 ? (
                    <p className="attribute-panel__empty">No attributes yet</p>
                ) : (
                    attributes.map((attr) => (
                        <AttributeItem key={attr.id} attribute={attr} />
                    ))
                )}
            </div>
        </div>
    );
};

export default AttributePanel;
