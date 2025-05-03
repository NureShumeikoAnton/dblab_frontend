import React, {useEffect} from 'react';
import {useState} from "react";
import axios from "axios";
import UniversalModalComponent from "./UniversalModalComponent.jsx";

import './styles/AdminTable.css';
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const AdminTableComponent = ({tableName, columns, endpoint, idField = "id"}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [isDeleteWithoutConfirmation, setIsDeleteWithoutConfirmation] = useState(false);

    const apiUrl = `http://localhost:5000/${endpoint}`;

    const authHeader = useAuthHeader();

    const handelInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    const fetchData = () => {
        setLoading(true);
        axios.get(apiUrl + "/getAll")
            .then((response) => {
                setData(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const handleAdd = () => {
        const emptyForm = {};
        columns.forEach(col => {
            if (col.key !== idField) {
                emptyForm[col.key] = col.isMulti ? [] : "";
            }
        });
        setFormData(emptyForm);
        setCurrentItem(null);
        setShowModal(true);
    }

    const handleEdit = (item) => {
        setCurrentItem(item);
        const updatedFormData = {};
        columns.forEach(col => {
            if (col.key !== idField) {
                updatedFormData[col.key] = item[col.key];
            }
        });
        setFormData(updatedFormData);
        setShowModal(true);
    }

    const handleDelete = (id) => {
        if (isDeleteWithoutConfirmation) {
            axios.delete(`${apiUrl}/delete/${id}`, {
                headers: {
                    'Authorization': authHeader.split(' ')[1],
                }
            })
                .then(() => {
                    fetchData();
                })
                .catch((error) => {
                    console.error("Error deleting item:", error);
                });
        } else {
            if (window.confirm("Are you sure you want to delete this item?")) {
                axios.delete(`${apiUrl}/delete/${id}`, {
                    headers: {
                        'Authorization': authHeader.split(' ')[1],
                    }
                })
                    .then(() => {
                        fetchData();
                    })
                    .catch((error) => {
                        console.error("Error deleting item:", error);
                    });
            }
        }
    }

    const handleSave = async (formData) => {
        try {
            if (currentItem) {
                // Update existing item
                console.log(formData);
                console.log(currentItem[idField]);
                await axios.put(`${apiUrl}/${currentItem[idField]}`, formData, {
                    headers: {
                        'Authorization': authHeader.split(' ')[1],
                    }
                })
                    .then((response) => {
                        console.log("Item updated:", response.data);
                    })
                    .catch((error) => {
                        console.error("Error updating item:", error);
                });
            } else {
                console.log(formData);
                let createdItemId = null;
                await axios.post(apiUrl + "/create", formData, {
                    headers: {
                        'Authorization': authHeader.split(' ')[1],
                    }
                })
                    .then((response) => {
                        console.log("Item created:", response.data);
                        createdItemId = response.data[idField];
                    })
                    .catch((error) => {
                        console.error("Error creating item:", error);
                    });
                if(createdItemId) {
                    handleAdditionalFields("add", createdItemId);
                }

            }
            setShowModal(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error saving item:", error);
        }
    };

    const handleCancel = () => {
        setShowModal(false);
    };

    const handleAdditionalFields = (action, createdId) => {
        const additionalFields = columns.filter(col => col.isMulti).map(col => col.key);
        additionalFields.forEach(field => {
            const additionalData = {
                [field]: formData[field],
                [idField]: currentItem ? currentItem[idField] : createdId
            };
            console.log(additionalData);
            if (action === "add") {
                const additionalEndpoint = "http://localhost:5000/" + columns.find(col => col.key === field).endpoint + "/create";
                additionalData[field].forEach((item) => {
                    const data = {
                        [field]: item,
                        [idField]: createdId
                    };
                    axios.post(additionalEndpoint, data, {
                        headers: {
                            'Authorization': authHeader.split(' ')[1],
                        }
                    })
                        .then((response) => {
                            console.log("Item created:", response.data);
                        })
                        .catch((error) => {
                            console.error("Error creating item:", error);
                        });
                });
            } else if (action === "remove") {
                const additionalEndpoint = "http://localhost:5000/" + columns.find(col => col.key === field).endpoint + "/delete";
                additionalData[field].forEach((item) => {
                    const data = {
                        [field]: item,
                        [idField]: createdId
                    };
                    axios.delete(additionalEndpoint, {
                        headers: {
                            'Authorization': authHeader.split(' ')[1],
                        },
                        data: data
                    })
                        .then((response) => {
                            console.log("Item deleted:", response.data);
                        })
                        .catch((error) => {
                            console.error("Error deleting item:", error);
                        });
                });
            }
        });
    }

    const getRowNames = () => {
        return columns
            .filter(col => col.key !== idField)
    };

    if(loading) {
        return <div className="loading">Loading data...</div>;
    }

    return (
        <div className="admin-table-container">
            <h2>{tableName}</h2>
            <button className="add-button" onClick={handleAdd}>+ Add New</button>
            <table className={"data-table"}>
                <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col.key}>{col.title}</th>
                    ))}
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.length === 0 ? (
                    <tr>
                    <td colSpan={columns.length + 1} className="no-data">
                            No data available
                        </td>
                    </tr>
                ) : (
                    data.map(item => (
                        <tr key={item[idField]}>
                            {columns.map(col => (
                                <td key={`${item[idField]}-${col.key}`}>
                                    <div className="column-wrapper">
                                        {col.format ? col.format(item[col.key]) : item[col.key]}
                                    </div>
                                </td>
                            ))}
                            <td className="actions">
                                <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDelete(item[idField])}>Delete</button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-backdrop">
                    <UniversalModalComponent
                        modalName={currentItem ? `Edit ${endpoint}` : `Add ${endpoint}`}
                        data={formData}
                        rows={getRowNames()}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        onChange={handelInputChange}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminTableComponent;