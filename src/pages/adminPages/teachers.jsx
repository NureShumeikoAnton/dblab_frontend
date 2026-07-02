import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import API_CONFIG from '../../config/api.js';

const Teachers = () => {


    const columns = [
        { key: "teacher_Id", title: "ID" },
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