import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const DevelopmentDirections = () => {
    const columns = [
        { key: "development_direction_Id", title: "ID" },
        { key: "development_direction_name", title: "Name" },
        { key: "development_direction_Description", title: "Description" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Development Directions"}
                columns={columns}
                endpoint={"developmentDirection"}
                idField={"development_direction_Id"}
            />
        </div>
    );
};

export default DevelopmentDirections;