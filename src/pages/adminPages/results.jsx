import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Results = () => {
    const [workOptions, setWorkOptions] = useState([]);
    const [resultTypeOptions, setResultTypeOptions] = useState([]);
    const [magazineOptions, setMagazineOptions] = useState([]);
    const [conferenceOptions, setConferenceOptions] = useState([]);
    const [competitionOptions, setCompetitionOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/work/getFromDb`, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then(response => {
                const options = response.data.map(work => ({
                    id: work.work_Id,
                    name: work.name || `Work ${work.work_Id}`
                }));
                setWorkOptions(options);
            })
            .catch(error => {
                console.error("Error fetching works:", error);
            });

        axios.get(`${API_CONFIG.BASE_URL}/resultType/getFromDb`, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then(response => {
                const options = response.data.map(type => ({
                    id: type.result_type_Id,
                    name: type.name
                }));
                setResultTypeOptions(options);
            })
            .catch(error => {
                console.error("Error fetching result types:", error);
            });

        axios.get(`${API_CONFIG.BASE_URL}/magazine/getFromDb`, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then(response => {
                const options = response.data.map(magazine => ({
                    id: magazine.magazine_Id,
                    name: magazine.name
                }));
                setMagazineOptions(options);
            })
            .catch(error => {
                console.error("Error fetching magazines:", error);
            });

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

        axios.get(`${API_CONFIG.BASE_URL}/competition/getFromDb`, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then(response => {
                const options = response.data.map(competition => ({
                    id: competition.competition_Id,
                    name: competition.name
                }));
                setCompetitionOptions(options);
            })
            .catch(error => {
                console.error("Error fetching competitions:", error);
            });
    }, []);

    const statusOptions = [
        { id: "В обробці", name: "В обробці" },
        { id: "Підтверджено", name: "Підтверджено" },
        { id: "Відхилено", name: "Відхилено" }
    ];

    const columns = [
        { key: "result_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "year", title: "Рік" },
        { key: "pages", title: "Сторінки" },
        { key: "full_name", title: "Повне ім'я" },
        { key: "status", title: "Статус", type: "select", options: statusOptions, editable: true },
        { key: "work_Id", title: "Робота", type: "select", options: workOptions, hidden: true },
        { key: "work_name", title: "Робота", modalHidden: true },
        { key: "result_type_Id", title: "Тип результату", type: "select", options: resultTypeOptions, hidden: true },
        { key: "result_type_name", title: "Тип результату", modalHidden: true },
        { key: "magazine_Id", title: "Журнал", type: "select", options: magazineOptions, hidden: true },
        { key: "magazine_name", title: "Журнал", modalHidden: true },
        { key: "conference_Id", title: "Конференція", type: "select", options: conferenceOptions, hidden: true },
        { key: "conference_name", title: "Конференція", modalHidden: true },
        { key: "competition_Id", title: "Конкурс", type: "select", options: competitionOptions, hidden: true },
        { key: "competition_name", title: "Конкурс", modalHidden: true },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Результати"}
                columns={columns}
                endpoint={"result"}
                idField={"result_Id"}
            />
        </div>
    );
};

export default Results;

