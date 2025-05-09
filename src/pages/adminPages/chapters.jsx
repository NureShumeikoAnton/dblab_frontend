import React from 'react';
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const Chapters = () => {
    const [levelOptions, setLevelOptions] = useState([]);
    const [directionOptions, setDirectionOptions] = useState([]);
    const [skillOptions, setSkillOptions] = useState([]);

    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get('http://localhost:5000/level/getFromDb', {
            headers: {
                'Authorization': authHeader.split(' ')[1],
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

        axios.get('http://localhost:5000/developmentDirection/getFromDb', {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
            .then(response => {
                const options = response.data.map(direction => ({
                    id: direction.development_direction_Id,
                    name: direction.development_direction_name
                }));
                setDirectionOptions(options);
            })
            .catch(error => {
                console.error('Error fetching development directions:', error);
            });

        axios.get('http://localhost:5000/skill/getFromDb', {
            headers: {
                'Authorization': authHeader.split(' ')[1],
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
    }, []);

    const columns = [
        { key: "chapter_Id", title: "ID" },
        { key: "chapter_name", title: "Chapter Name" },
        { key: "level_Id", title: "Level", type: "select", options: levelOptions, hidden: true },
        { key: "level_name", title: "Level Name", modalHidden: true },
        { key: "development_direction_Id", title: "Development Direction", type: "select", options: directionOptions, hidden: true },
        { key: "development_direction_name", title: "Development Direction", modalHidden: true },
        { key: "skill_Id", title: "Skill", type: "select", options: skillOptions, isMulti: true, endpoint: "skillChapter", hidden: true },
        { key: "skill_names", title: "Skill Names", isMulti: true, modalHidden: true },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Chapters"}
                columns={columns}
                endpoint={"chapter"}
                idField={"chapter_Id"}
            />
        </div>
    );
};

export default Chapters;