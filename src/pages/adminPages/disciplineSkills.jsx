import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const DisciplineSkills = () => {
    const [disciplineOptions, setDisciplineOptions] = useState([]);
    const [skillOptions, setSkillOptions] = useState([]);
    const [levelOptions, setLevelOptions] = useState([]);

    const authHeader = useAuthHeader();

    useEffect(() => {
        // Fetch disciplines
        axios.get('http://localhost:5000/discipline/getFromDb', {
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

        // Fetch skills
        axios.get('http://localhost:5000/skill/getFromDb', {
            headers: {
                Authorization: authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(skill => ({
                    id: skill.skill_Id,
                    name: skill.skill_name
                }));
                setSkillOptions(options);
            })
            .catch(error => {
                console.error('Error fetching skills:', error);
            });

        // Fetch levels
        axios.get('http://localhost:5000/level/getFromDb', {
            headers: {
                Authorization: authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(level => ({
                    id: level.level_Id,
                    name: level.level_name
                }));
                setLevelOptions(options);
            })
            .catch(error => {
                console.error('Error fetching levels:', error);
            });
    }, []);

    const columns = [
        { key: "disciplineSkill_Id", title: "ID" },
        { key: "discipline_Id", title: "Discipline", type: "select", options: disciplineOptions, hidden: true },
        { key: "discipline_name", title: "Discipline", modalHidden: true },
        { key: "skill_Id", title: "Skill", type: "select", options: skillOptions, hidden: true },
        { key: "skill_name", title: "Skill", modalHidden: true },
        { key: "level_Id", title: "Level", type: "select", options: levelOptions, hidden: true },
        { key: "level_name", title: "Level", modalHidden: true },
        { key: "learning_type", title: "Learning Type" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"DisciplineSkills"}
                columns={columns}
                endpoint={"disciplineSkill"}
                idField={"disciplineSkill_Id"}
            />
        </div>
    );
};

export default DisciplineSkills;