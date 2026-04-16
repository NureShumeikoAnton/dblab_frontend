import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Proposal = () => {
    const [proposalTypeOptions, setProposalTypeOptions] = useState([]);
    const [directionOptions, setDirectionOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/proposalType/getall`, {
            headers: { 'Authorization': authHeader }
        })
        .then(response => {
            const options = response.data.map(item => ({
                id: item.proposal_type_Id,
                name: item.name
            }));
            setProposalTypeOptions(options);
        })
        .catch(err => console.error("Error fetching proposal types:", err));

        axios.get(`${API_CONFIG.BASE_URL}/direction/getall`, {
            headers: { 'Authorization': authHeader }
        })
        .then(response => {
            const options = response.data.map(item => ({
                id: item.direction_Id,
                name: item.name
            }));
            setDirectionOptions(options);
        })
        .catch(err => console.error("Error fetching directions:", err));

        axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`, {
            headers: { 'Authorization': authHeader }
        })
        .then(response => {
            const options = response.data.map(item => ({
                id: item.teacher_Id,
                name: item.full_name
            }));
            setTeacherOptions(options);
        })
        .catch(err => console.error("Error fetching teachers:", err));

    }, []);

    const columns = [
        { key: "proposal_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "description", title: "Опис", type: "textarea", note: "Max length is 2000 symbols" },
        { 
            key: "status", 
            title: "Статус", 
            type: "select", 
            options: [
                {id: 'Запропоновано', name: 'Запропоновано'}, 
                {id: 'Підтверджено', name: 'Підтверджено'},
                {id: 'Відкладено', name: 'Відкладено'},
                {id: 'Завершено', name: 'Завершено'}
            ] 
        },
        { 
            key: "complexity", 
            title: "Складність", 
            type: "select", 
            options: [
                {id: 'Низька', name: 'Низька'}, 
                {id: 'Середня', name: 'Середня'}, 
                {id: 'Висока', name: 'Висока'}
            ] 
        },
        { key: "teacher_Id", title: "Викладач", type: "select", options: teacherOptions, displayAsName: true },
        { key: "proposal_type_Id", title: "Тип пропозиції", type: "select", options: proposalTypeOptions, displayAsName: true },
        { key: "direction_Id", title: "Напрям", type: "select", options: directionOptions, displayAsName: true }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Пропозиції"}
                columns={columns}
                endpoint={"proposal"}
                idField={"proposal_Id"}
            />
        </div>
    );
};

export default Proposal;