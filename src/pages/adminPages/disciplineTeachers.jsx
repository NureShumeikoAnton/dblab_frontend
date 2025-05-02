import React, {useEffect, useState} from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";

const DisciplineTeachers = () => {
    const [disciplineOptions, setDisciplineOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/discipline/getAll')
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

        axios.get('http://localhost:5000/teacher/getAll')
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
        axios.get('http://localhost:5000/language/getAll')
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
        {key: "discipline_Id", title: "Discipline ID", type: "select", options: disciplineOptions},
        {key: "teacher_Id", title: "Teacher ID", type: "select", options: teacherOptions},
        {key: "language_Id", title: "Language ID", type: "select", options: languageOptions},
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