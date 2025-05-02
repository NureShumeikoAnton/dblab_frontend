import React, {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import './styles/CourseDetails.css';

import axios from "axios";

const TeacherSliderComponent = ({teachers}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    const slideLeft = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setSlideDirection("left");
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex === 0 ? teachers.length - 1 : prevIndex - 1));
        }, 300);
        setTimeout(() => {
            setSlideDirection("");
            setIsAnimating(false);
        }, 500);
    };

    const slideRight = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setSlideDirection("right");
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex === teachers.length - 1 ? 0 : prevIndex + 1));
        }, 300);
        setTimeout(() => {
            setSlideDirection("");
            setIsAnimating(false);
        }, 500);
    };

    return (
        <div className="teacher-slider">
            {teachers.length > 1 && (
                <button className="arrow-left pulse-left" onClick={slideLeft}>
                    <ChevronLeft size={24}/>
                </button>
            )}
            <div className={`teacher-info slide-${slideDirection}`}>
                <div className={"teacher-text"}>
                    <h1 className="teacher-name">{teachers[currentIndex].full_name}</h1>
                    <h2 className="teacher-position">{teachers[currentIndex].position}</h2>
                    <p className="teacher-description">{teachers[currentIndex].text}</p>
                </div>
                <div className="teacher-image">
                    <img src={teachers[currentIndex].photo} alt={teachers[currentIndex].full_name}/>
                </div>
            </div>
            {teachers.length > 1 && (
                <button className="arrow-right pulse-right" onClick={slideRight}>
                    <ChevronRight size={24}/>
                </button>
            )}
        </div>
    );
};

const templateData = {
    discipline_Id: 1,
    discipline_name: "Course Name",
    discipline_Description: "Course description goes here. Full part of description.",
    discipline_type: "Mandatory",
    volume: "3 ECTS",
    skills: ["Skill 1", "Skill 2", "Skill 3"],
    teachers: [
        {
            full_name: "John Doe",
            position: "Senior Developer",
            text: "Expert in React and Node.js.",
            photo: "https://via.placeholder.com/150"
        },
        {
            name: "Jane Smith",
            position: "Project Manager",
            text: "Experienced in Agile methodologies.",
            photo: "https://via.placeholder.com/150"
        }
    ],
    syllabus_link: "https://example.com/syllabus",
};

const CourseDetailsPage = () => {
    const [course, setCourse] = useState(templateData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const courseId = window.location.pathname.split('/').pop();
        axios.get(`http://localhost:5000/discipline/getFull/${courseId}`)
            .then(response => {
                console.log(response.data);
                setCourse(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching course details:", error);
            });
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <h1>Loading...</h1>
            </div>
        );
    }

    return (
        <div>
            <div className="course-header-container">
                <div className="stars-bar">
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                </div>
                <h1>{course.discipline_name}</h1>
                <h2>{course.discipline_Description.split('.')[0]}</h2>
                <div className="course-additional-info-container">
                    <div className="course-type">Тип дисципліни: <span>{course.discipline_type}</span></div>
                    <div className="course-value">Об'єм: <span>{course.volume}</span></div>
                </div>
            </div>
            <div className="course-details-container">
                <div className="course-description-container">
                    <h3>Description</h3>
                    <p>{course.discipline_Description}</p>
                </div>
                <div className="course-content-container">
                    <div className="course-teacher-container">
                        <h3>Teachers</h3>
                        <TeacherSliderComponent
                            teachers={course.teachers}
                        />
                    </div>
                    <div className="course-skills-container">
                        <h3>Skills</h3>
                        <ul>
                            {course.skills.map((skill, index) => (
                                <li key={index} className="skill-item">
                                    {skill}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="course-footer-container">
                <button className="course-footer-button">
                    <a href={course.syllabus_link}>Sylabus</a>
                </button>
                <button className="course-footer-button">
                    <a href="/courses">Back to Courses</a>
                </button>
            </div>
        </div>
    );
};

export default CourseDetailsPage;