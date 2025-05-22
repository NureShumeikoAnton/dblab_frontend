import React, { useState } from "react";
import "./styles/InputField.css";

const InputFieldComponent = ({
                        label,
                        name,
                        type = "text",
                        icon,
                        placeholder = "",
                        value,
                        onChange,
                        error = "",
                        onKeyPress,
                        isPassword = false,
                        disabled = false
                    }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleTogglePassword = (e) => {
        e.preventDefault();
        setShowPassword(!showPassword);
    };

    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="input-field-container">
            {label && <label className="input-label">{label}</label>}
            <div
                className={`input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
            >
                {icon && <div className="input-icon">{icon}</div>}
                <input
                    className="input-element"
                    type={actualType}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyPress={onKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                />
                {isPassword && (
                    <button
                        className="password-toggle-btn"
                        onClick={handleTogglePassword}
                        type="button"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error && <p className="input-error">{error}</p>}
        </div>
    );
};

export default InputFieldComponent;