import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Work = () => {
    const [proposalOptions, setProposalOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const statusOptions = [
        { id: 'В обробці', name: 'В обробці' },
        { id: 'Активна', name: 'Активна' },
        { id: 'Завершена', name: 'Завершена' },
        { id: 'Відхилена', name: 'Відхилена' }
    ];
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`, {
            headers: { 'Authorization': authHeader }
        })
        .then(response => {
            const options = response.data.map(item => ({
                id: item.proposal_Id,
                name: item.name
            }));
            setProposalOptions(options);
        })
        .catch(err => console.error("Error fetching proposals:", err));

        axios.get(`${API_CONFIG.BASE_URL}/user/getall`, {
            headers: { 'Authorization': authHeader }
        })
        .then(response => {
            const options = response.data.map(item => ({
                id: item.user_Id,
                name: item.nickname
            }));
            setUserOptions(options);
        })
        .catch(err => console.error("Error fetching users:", err));

    }, []);

    const columns = [
        { key: "work_Id", title: "ID" },
        { 
            key: "status", 
            title: "Статус", 
            type: "select", 
            options: statusOptions,
            editable: true
        },
        { key: "begining_date", title: "Дата прикріплення", type: "date" },
        { key: "changes_date", title: "Останні зміни", type: "date" },
        { key: "review", title: "Оцінка" },
        { key: "comment", title: "Коментар" },
        { key: "name", title: "Назва" },
        { key: "file", title: "Файл/Посилання", type: "textarea"},
        { key: "proposal_Id", title: "Пропозиція", type: "select", options: proposalOptions, displayAsName: true },
        { key: "user_Id", title: "Користувач", type: "select", options: userOptions, displayAsName: true }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Роботи"}
                columns={columns}
                endpoint={"work"}
                idField={"work_Id"}
            />
        </div>
    );
};

export default Work;