import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const Materials = () => {
    const [eventOptions, setEventOptions] = useState([]);

    const authToken = useAuthHeader().split(' ')[1];

    useEffect(() => {
        axios.get("http://localhost:5000/event/getFromDb", {
            headers: {
                'Authorization': authToken,
            }
        })
            .then(response => {
                setEventOptions(response.data.map(event => ({
                    id: event.event_Id, 
                    name: `${event.event_name}${event.lesson_desc.slice(
                        event.lesson_desc.indexOf(","), 
                        event.lesson_desc.lastIndexOf(" ")
                    )}`,
                })));
            })
            .catch(error => {
                console.error("Error fetching events:", error);
            });
    }, []);

    const columns = [
        { key: "material_Id", title: "ID" },
        { key: "material_name", title: "Назва" },
        { key: "event_Id", title: "Подія", type: "select", options: eventOptions, hidden: true },
        { key: "event_name", title: "Подія", modalHidden: true },
        { key: "file", title: "Посилання" },
        { key: "material_type", title: "Тип" },
    ];

    return (
        <AdminTableComponent
            tableName={"Матеріали"}
            columns={columns}
            endpoint={"material"}
            idField={"material_Id"}
        />
    );
};

export default Materials;