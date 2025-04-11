import React, {useEffect, useState} from 'react';
import CourseComponent from '../components/CourseComponent';
import './styles/Courses.css';
import {Search, Filter, Bookmark} from "lucide-react";
import axios from "axios";

const coursesData = [
    {
        discipline_Id: 1,
        discipline_name: "Advanced Database Systems",
        discipline_Description: "Learn database design and optimization techniques",
        teachers: ["Dr. Maria Johnson", "Prof. Alex Chen"],
        skills: ["SQL", "Database Design", "Data Modeling"],
        discipline_type: "Обов'язкова",
        volume: 4,
        syllabus_link: "/syllabus/advanced-database"
    },
    {
        discipline_Id: 2,
        discipline_name: "Web Application Development",
        discipline_Description: "Build modern web applications with React",
        teachers: ["Prof. Michael Smith"],
        skills: ["React", "JavaScript", "CSS"],
        discipline_type: "Необов'язкова",
        volume: 3,
        syllabus_link: "/syllabus/web-dev"
    },
    {
        discipline_Id: 3,
        discipline_name: ".NET Framework Development",
        discipline_Description: "Enterprise application development with .NET",
        teachers: ["Dr. Anna Wilson", "Dr. Robert Lee"],
        skills: [".NET", "C#", "Azure"],
        discipline_type: "Обов'язкова",
        volume: 5,
        syllabus_link: "/syllabus/dotnet-dev"
    },
    {
        discipline_Id: 4,
        discipline_name: "Data Science Fundamentals",
        discipline_Description: "Introduction to data analysis and visualization",
        teachers: ["Prof. Lisa Wong"],
        skills: ["Python", "Statistics", "Data Visualization"],
        discipline_type: "Необов'язкова",
        volume: 3,
        syllabus_link: "/syllabus/data-science"
    },
    {
        discipline_Id: 5,
        discipline_name: "Mobile App Development",
        discipline_Description: "Creating cross-platform mobile applications",
        teachers: ["Dr. James Peterson"],
        skills: ["React Native", "JavaScript", "Mobile UI"],
        discipline_type: "Обов'язкова",
        volume: 4,
        syllabus_link: "/syllabus/mobile-dev"
    }
];

let allSkills = [...new Set(coursesData.flatMap(course => course.skills))].sort();

const CoursesPage = () => {
    const [allCourses, setAllCourses] = useState(coursesData);
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedSkills, setSelectedSkills] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/discipline/getFull")
            .then(response => {
                console.log(response.data);
                setAllCourses(response.data);
                setCourses(response.data);
                allSkills = [...new Set(response.data.flatMap(course => course.skills))].sort();
            })
            .catch(error => {
                console.error("Error fetching courses:", error);
            });
    }, []);

    useEffect(() => {
        let filtered = coursesData;

        if (searchTerm) {
            filtered = filtered.filter(course =>
                course.discipline_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.discipline_Description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(course => course.discipline_type === typeFilter);
        }

        if (selectedSkills.length > 0) {
            filtered = filtered.filter(course =>
                selectedSkills.every(skill => course.skills.includes(skill))
            );
        }

        setCourses(filtered);
    }, [searchTerm, typeFilter, selectedSkills]);

    const toggleSkill = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const navigateToCourse = (courseId) => {
        window.location.href = `/course/${courseId}`;
    }

    return (
        <div>
            <h1>Перелік доступних дисциплін</h1>
            <div className="course-filter-container">
                {/* Search Bar */}
                <div className="search-bar">
                    <div className="search-icon">
                        <Search className="icon"/>
                    </div>
                    <input
                        type="text"
                        placeholder="Пошук за назвою..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="filters-container">
                    {/* Type Filter */}
                    <div className="type-filter">
                        <Filter className="icon type-icon"/>
                        <span className="label">Тип:</span>
                        <select
                            className="select-input"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">Усі дисципліни</option>
                            <option value="Обов'язкова">Обов'язкова</option>
                            <option value="Необов'язкова">Необов'язкова</option>
                        </select>
                    </div>

                    {/* Skills Filter */}
                    <div className="skills-filter">
                        <div className="skills-header">
                            <Bookmark className="icon skills-icon"/>
                            <span className="label">Напрями:</span>
                        </div>
                        <div className="search-skills-list">
                            {allSkills.map(skill => (
                                <label key={skill} className="skill-checkbox">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={selectedSkills.includes(skill)}
                                        onChange={() => toggleSkill(skill)}
                                    />
                                    <span className="skill-name">{skill}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="results-count">
                Знайдено {courses.length} {courses.length === 1 ? "дисципліну" : "дисциплін"}
            </div>

            <div className="course-list">
                {courses.length > 0 ? (
                    <div className="course-list-content">
                        {courses.map(course => (
                            <CourseComponent
                                key={course.id}
                                course={course}
                                navigateToCourse={navigateToCourse}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-courses">
                        <h3>Не знайдено жодної дисципліни</h3>
                        <p>Спробуйте змінити параметри пошуку або скинути фільтри.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesPage;