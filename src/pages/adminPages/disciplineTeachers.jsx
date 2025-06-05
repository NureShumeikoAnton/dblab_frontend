import React, {useEffect, useState} from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const DisciplineTeachers = () => {
    const [disciplineOptions, setDisciplineOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);

    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/discipline/getFromDb`, {
            headers: {
                Authorization: authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(discipline => ({
                    id: discipline.discipline_Id,
                    name: discipline.discipline_name
                }));
                setDisciplineOptions(options);
            })
            .catch(error => {
                console.error('Error fetching disciplines:', error);
            });

        axios.get(`${API_CONFIG.BASE_URL}/teacher/getFromDb`, {
            headers: {
                Authorization: authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(teacher => ({
                    id: teacher.teacher_Id,
                    name: teacher.full_name
                }));
                setTeacherOptions(options);
            })
            .catch(error => {
                console.error('Error fetching teachers:', error);
            });
        axios.get(`${API_CONFIG.BASE_URL}/language/getFromDb`, {
            headers: {
                Authorization: authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(language => ({
                    id: language.language_Id,
                    name: language.language_name
                }));
                setLanguageOptions(options);
            })
            .catch(error => {
                console.error('Error fetching languages:', error);
            });
    }, []);

    const columns = [
        {key: "disciplineTeacher_Id", title: "ID"},
        {key: "discipline_Id", title: "Discipline ID", type: "select", options: disciplineOptions, hidden: true},
        {key: "discipline_name", title: "Discipline Name", modalHidden: true},
        {key: "teacher_Id", title: "Teacher ID", type: "select", options: teacherOptions, hidden: true},
        {key: "full_name", title: "Teacher Name", modalHidden: true},
        {key: "language_Id", title: "Language ID", type: "select", options: languageOptions, hidden: true},
        {key: "language_name", title: "Language Name", modalHidden: true},
        {key: "beginning_Year", title: "Beginning Year"},
    ];
    return (
        <div>
            <AdminTableComponent
                tableName={"DisciplineTeachers"}
                columns={columns}
                endpoint={"disciplineTeacher"}
                idField={"disciplineTeacher_Id"}
            />
        </div>
    );
};

export default DisciplineTeachers;