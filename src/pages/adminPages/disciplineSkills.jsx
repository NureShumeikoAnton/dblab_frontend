import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import {useEffect, useState} from "react";
import axios from "axios";

const DisciplineSkills = () => {
    const [disciplineOptions, setDisciplineOptions] = useState([]);
    const [skillOptions, setSkillOptions] = useState([]);
    const [levelOptions, setLevelOptions] = useState([]);

    useEffect(() => {
        // Fetch disciplines
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

        // Fetch skills
        axios.get('http://localhost:5000/skill/getAll')
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
        axios.get('http://localhost:5000/level/getAll')
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
        { key: "discipline_Id", title: "Discipline", type: "select", options: disciplineOptions },
        { key: "skill_Id", title: "Skill", type: "select", options: skillOptions },
        { key: "level_Id", title: "Level", type: "select", options: levelOptions },
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