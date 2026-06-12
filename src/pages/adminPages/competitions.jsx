import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Competitions = () => {
    const [conferenceOptions, setConferenceOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/conference/getFromDb`, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then(response => {
                const options = response.data.map(conference => ({
                    id: conference.conference_Id,
                    name: conference.name
                }));
                setConferenceOptions(options);
            })
            .catch(error => {
                console.error("Error fetching conferences:", error);
            });
    }, []);

    const columns = [
        { key: "competition_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "approximate_date", title: "Дата", type: "date" },
        { key: "host", title: "Організатор" },
        { key: "link", title: "Посилання" },
        { key: "conference_Id", title: "Конференція", type: "select", options: conferenceOptions, hidden: true },
        { key: "conference_name", title: "Конференція", modalHidden: true },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Конкурси"}
                columns={columns}
                endpoint={"competition"}
                idField={"competition_Id"}
            />
        </div>
    );
};

export default Competitions;

