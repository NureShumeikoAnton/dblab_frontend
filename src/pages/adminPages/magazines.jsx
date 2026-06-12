import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Magazines = () => {
    const columns = [
        { key: "magazine_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "publisher", title: "Видавець" },
        { key: "city", title: "Місто" },
        { key: "release_frequency", title: "Періодичність виходу" },
        { key: "link", title: "Посилання" },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Журнали"}
                columns={columns}
                endpoint={"magazine"}
                idField={"magazine_Id"}
            />
        </div>
    );
};

export default Magazines;

