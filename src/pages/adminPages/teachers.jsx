import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import {useEffect, useState} from "react";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Teachers = () => {
    const [userOptions, setUserOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
            axios.get(`${API_CONFIG.BASE_URL}/user/getFromDb`, {
                headers: {
                    'Authorization': authHeader.split(' ')[1]
                }
            })
            .then(response => {
                const options = response.data.map(user => ({
                    id: user.user_Id,
                    name: user.login
                }));
                setUserOptions(options);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }, []);

    const columns = [
        { key: "teacher_Id", title: "ID" },
        { key: "user_Id", title: "User ID", type: "select", options: userOptions, hidden: true },
        { key: "login", title: "Login", modalHidden: true },
        { key: "full_name", title: "Full Name" },
        { key: "place_of_Employment", title: "Place of Employment" },
        { key: "position", title: "Position" },
        { key: "text", title: "Text" },
        { key: "level", title: "Level" },
        { key: "teacher_role", title: "Teacher Role" },
        { key: "photo", title: "Photo", type: "file", hidden: true },
    ];
    return (
        <div>
            <AdminTableComponent
                tableName={"Teachers"}
                columns={columns}
                endpoint={"teacher"}
                idField={"teacher_Id"}
            />
        </div>
    );
};

export default Teachers;