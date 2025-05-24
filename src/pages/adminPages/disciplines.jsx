import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Disciplines = () => {
    const columns = [
        {key: "discipline_Id", title: "ID"},
        {key: "discipline_name", title: "Discipline"},
        {key: "discipline_Description", title: "Description", type: "textarea", note: "Max length is 255 symbols"},
        {key: "discipline_type", title: "Type", type: "select",
            options: [
                {id: "Обов'язкова", name: "Обов'язкова"},
                {id: "Вибіркова", name: "Вибіркова"},
            ]
        },
        {key: "volume", title: "Credits"},
        {key: "syllabus_link", title: "Syllabus"},
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