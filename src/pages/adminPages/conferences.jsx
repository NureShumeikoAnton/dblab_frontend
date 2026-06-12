import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Conferences = () => {
    const booleanOptions = [
        { id: "true", name: "Так" },
        { id: "false", name: "Ні" },
    ];

    const columns = [
        { key: "conference_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "approximate_date", title: "Дата", type: "date" },
        { key: "host", title: "Організатор" },
        { key: "city", title: "Місто" },
        { key: "link", title: "Посилання" },
        { key: "online", title: "Онлайн", type: "select", options: booleanOptions },
        { key: "offline", title: "Офлайн", type: "select", options: booleanOptions },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Конференції"}
                columns={columns}
                endpoint={"conference"}
                idField={"conference_Id"}
            />
        </div>
    );
};

export default Conferences;

