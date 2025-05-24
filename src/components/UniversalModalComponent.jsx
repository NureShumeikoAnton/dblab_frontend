import React from 'react';
import './styles/UniversalModal.css';
import InputFieldComponent from "./InputFieldComponent.jsx";
import SelectFieldComponent from "./SelectFieldComponent.jsx";

const UniversalModalComponent = ({modalName, data, rows, onSave, onCancel, onChange, isEditing}) => {
    const handleSave = () => {
        onSave(data);
    };

    const handleCancel = () => {
        onCancel();
    }

    const handleFileChange = (e, row) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                onChange({ target: { name: row.key, value: base64 } }, row);
            };
            reader.readAsDataURL(file);
        }
    }


    return (
        <div className={"universal-modal-window"}>
            <div className={"universal-modal-header"}>
                <h2>{modalName}</h2>
            </div>
            <div className={"universal-modal-body"}>
                {rows.map((row, index) => (
                    !row.modalHidden && (
                        <div key={index} className={"universal-modal-row"}>
                            {row.type === "select" ? (
                                <SelectFieldComponent
                                    label={row.title}
                                    name={row.key}
                                    value={data[row.key]}
                                    onChange={(e) => {
                                        onChange(e, row)
                                    }}
                                    options={row.options}
                                    placeholder={row.title}
                                    isMulti={row.isMulti || false}
                                    disabled={isEditing && row.disabledOnEdit}
                                />
                            ) : row.type === "file" ? (
                                <div className="file-input-container">
                                    <label>{row.title}</label>
                                    <InputFieldComponent
                                        type="file"
                                        name={row.key}
                                        onChange={(e) => handleFileChange(e, row)}
                                    />
                                </div>
                            ) : (
                                <InputFieldComponent
                                    label={row.title}
                                    name={row.key}
                                    type={"text"}
                                    placeholder={row.title}
                                    value={data[row.key]}
                                    onChange={(e) => {
                                        onChange(e, row)
                                    }}
                                    disabled={isEditing && row.disabledOnEdit}
                                />
                            )}
                            {row.note && (
                                <p className="input-note">{row.note}</p>
                            )}
                        </div>
                    )
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