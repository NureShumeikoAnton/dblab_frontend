import React from 'react';
import './styles/AttributeItem.css';

const AttributeItem = ({ attribute }) => {
    const { name, data_type, retired_at_stage_Id } = attribute;
    const isRetired = retired_at_stage_Id !== null;

    return (
        <div className={`attribute-item${isRetired ? ' attribute-item--retired' : ''}`}>
            <span className="attribute-item__name">{name}</span>
            <span className="attribute-item__type">{data_type}</span>
        </div>
    );
};

export default AttributeItem;
