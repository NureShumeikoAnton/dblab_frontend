import React from 'react';
import './styles/UniversalModal.css';
import InputFieldComponent from "./InputFieldComponent.jsx";
import SelectFieldComponent from "./SelectFieldComponent.jsx";

const UniversalModalComponent = ({modalName, data, rows, onSave, onCancel, onChange}) => {
    const handleSave = () => {
        onSave(data);
    };

    const handleCancel = () => {
        onCancel();
    }


    return (
        <div className={"universal-modal-window"}>
            <div className={"universal-modal-header"}>
                <h2>{modalName}</h2>
            </div>
            <div className={"universal-modal-body"}>
                {rows.map((row, index) => (
                    <div key={index} className={"universal-modal-row"}>
                        {row.type === "select" ? (
                            <SelectFieldComponent
                                label={row.title}
                                name={row.key}
                                value={data[row.key]}
                                onChange={(e) => {onChange(e, row)}}
                                options={row.options}
                                placeholder={row.title}
                                isMulti={row.isMulti || false}
                            />
                        ) : (
                            <InputFieldComponent
                                label={row.title}
                                name={row.key}
                                type={"text"}
                                placeholder={row.title}
                                value={data[row.key]}
                                onChange={(e) => {onChange(e, row)}}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className={"universal-modal-footer"}>
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default UniversalModalComponent;