import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Disciplines = () => {
    const columns = [
        {key: "discipline_Id", title: "ID"},
        {key: "discipline_name", title: "Discipline"},
        {key: "discipline_Description", title: "Description", type: "textarea"},
        {key: "discipline_type", title: "Type", type: "select",
            options: [
                {id: "Обов'язкова", name: "Обов'язкова"},
                {id: "Необов'язкова", name: "Необов'язкова"},
            ]
        },
        {key: "volume", title: "Credits"},
        {key: "syllabus_link", title: "Syllabus"},
        {key: "repeat_time", title: "Type", type: "select",
            options: [
                {id: "1", name: "Обов'язкова"},
                {id: "7", name: "Необов'язкова"},
            ]
        },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Disciplines"}
                columns={columns}
                endpoint={"discipline"}
                idField={"discipline_Id"}
            />
        </div>
    );
};

export default Disciplines;