import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Users = () => {
    const roleOptions = [
        { id: "student", name: "Student" },
        { id: "expert", name: "Expert" },
        { id: "admin", name: "Admin" }
    ];

    const booleanOptions = [
        { id: true, name: "Yes" },
        { id: false, name: "No" }
    ];

    const columns = [
        { key: "user_Id", title: "ID" },
        { key: "nickname", title: "Nickname" },
        { key: "email", title: "Email" },
        { key: "login", title: "Login" },
        { key: "password", title: "Password (leave blank to keep)", hidden: true, clearOnEdit: true },
        { key: "role", title: "Role", type: "select", options: roleOptions },
        { key: "student_group", title: "Student Group" },
        { key: "verified", title: "Verified", type: "select", options: booleanOptions }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Users"}
                columns={columns}
                endpoint={"user"}
                idField={"user_Id"}
            />
        </div>
    );
};

export default Users;
