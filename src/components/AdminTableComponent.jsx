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
                //await axios.put(`${apiUrl}/${currentItem[idField]}`, formData);
            } else {
                console.log(formData);
                await axios.post(apiUrl + "/create", formData, {
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