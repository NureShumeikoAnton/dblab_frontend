import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Levels = () => {
    const columns = [
        {key: "level_Id", title: "ID"},
        {key: "level_name", title: "Level"}
    ];
    return (
        <div>
            <AdminTableComponent
                tableName={"Levels"}
                columns={columns}
                endpoint={"level"}
                idField={"level_Id"}
            />
        </div>
    );
};

export default Levels;