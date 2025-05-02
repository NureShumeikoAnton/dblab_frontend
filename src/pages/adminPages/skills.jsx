import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Skills = () => {
    const columns = [
        {key: "skill_Id", title: "ID"},
        {key: "skill_name", title: "Skill"}
    ];
    return (
        <div>
            <AdminTableComponent
                tableName={"Skills"}
                columns={columns}
                endpoint={"skill"}
                idField={"skill_Id"}
            />
        </div>
    );
};

export default Skills;