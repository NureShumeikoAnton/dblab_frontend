import React, { useState, useEffect, useRef } from "react";
import "./styles/InputField.css";
import "./styles/MultiSelect.css"; // We'll create this file next

const SelectFieldComponent = ({
                                  label,
                                  name,
                                  value,
                                  onChange,
                                  options = [],
                                  placeholder = "Select items",
                                  error = "",
                                  icon,
                                  isMulti = false, // New prop to enable multi-select functionality
                                  disabled = false
                              }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState([]);
    const dropdownRef = useRef(null);

    // Handle initial values and updates from parent
    useEffect(() => {
        if (isMulti) {
            // For multi-select, value should be an array
            const initialValues = Array.isArray(value)
                ? value
                : value ? [value] : [];
            setSelectedValues(initialValues);
        }
    }, [value, isMulti]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Don't close dropdown on blur for multi-select
        // It will be closed when clicking outside
        if (!isMulti) {
            setIsOpen(false);
        }
    };

    const handleSelect = (option) => {
        if (isMulti) {
            // For multi-select
            let newSelectedValues;

            if (selectedValues.includes(option.id)) {
                // Remove if already selected
                newSelectedValues = selectedValues.filter(val => val !== option.id);
            } else {
                // Add if not selected
                newSelectedValues = [...selectedValues, option.id];
            }

            setSelectedValues(newSelectedValues);

            // Create a synthetic event to match the expected onChange behavior
            const syntheticEvent = {
                target: {
                    name,
                    value: newSelectedValues
                }
            };

            onChange(syntheticEvent);
        } else {
            // Standard single select - existing behavior
            setIsOpen(false);

            // Create a synthetic event
            const syntheticEvent = {
                target: {
                    name,
                    value: option.id
                }
            };

            onChange(syntheticEvent);
        }
    };

    const getSelectedLabels = () => {
        if (!isMulti) return "";

        return options
            .filter(option => selectedValues.includes(option.id))
            .map(option => option.name)
            .join(", ");
    };

    // Render a standard select element for single select
    if (!isMulti) {
        return (
            <div className="input-field-container">
                {label && <label className="input-label">{label}</label>}
                <div className={`input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}>
                    {icon && <div className="input-icon">{icon}</div>}
                    <select
                        className="input-element"
                        name={name}
                        value={value || ""}
                        onChange={onChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                    >
                        {(!value || value === "") && <option value="">{placeholder}</option>}
                        {options.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </div>
                {error && <p className="input-error">{error}</p>}
            </div>
        );
    }

    // Render custom multi-select dropdown
    return (
        <div className="input-field-container">
            {label && <label className="input-label">{label}</label>}
            <div
                ref={dropdownRef}
                className={`input-wrapper multi-select-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
            >
                {icon && <div className="input-icon">{icon}</div>}
                <div
                    className="multi-select-input"
                    onClick={() => setIsOpen(!isOpen)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    tabIndex={0}
                >
                    {selectedValues.length > 0 ? (
                        <div className="selected-values">
                            {getSelectedLabels() || placeholder}
                        </div>
                    ) : (
                        <div className="placeholder">{placeholder}</div>
                    )}
                    <div className="dropdown-arrow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
                {isOpen && (
                    <div className="dropdown-menu">
                        {options.length === 0 ? (
                            <div className="dropdown-item no-options">No options available</div>
                        ) : (
                            options.map((option) => (
                                <div
                                    key={option.id}
                                    className={`dropdown-item ${selectedValues.includes(option.id) ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className="checkbox">
                                        {selectedValues.includes(option.id) && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <span>{option.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            {error && <p className="input-error">{error}</p>}
        </div>
    );
};

export default SelectFieldComponent;