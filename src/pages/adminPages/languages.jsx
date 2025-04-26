import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Languages = () => {
    const columns = [
        {key: "language_Id", title: "ID"},
        {key: "language_name", title: "Language"},
    ];

    return (
        <>
            <AdminTableComponent
                tableName={"Language"}
                columns={columns}
                endpoint={"language"}
                idField={"language_Id"}
            />
        </>
    );
};

export default Languages;