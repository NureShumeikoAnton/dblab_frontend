import React from 'react';
import {ChevronRight, Download} from "lucide-react";
import "./styles/Course.css";

const CourseComponent = ({course, navigateToCourse}) => {
    const courseSkills = course.skills.split(",").map(skill => skill.trim());
    return (
        <div className="course-card" style={{borderLeftColor: course.discipline_type === "Обов'язкова" ? "#F59650" : "#0094C8"}}>
            <div className="course-card-content" onClick={() => navigateToCourse(course.discipline_Id)}>
                <div className="course-card-header">
                    <div>
                        <h2 className="course-card-title">{course.discipline_name}</h2>
                        <p className="course-card-shortdesc">{course.discipline_Description}</p>
                    </div>
                    <div className="course-card-type-and-credits">
            <span
                className="course-card-type"
                style={{
                    backgroundColor: course.discipline_type === "Обов'язкова" ? "#FFF1E6" : "#E6F4F9",
                    color: course.discipline_type === "Обов'язкова" ? "#F59650" : "#0094C8"
                }}
            >
              {course.discipline_type}
            </span>
                        <span className="course-card-credits">
              {course.volume} {course.volume === 1 ? "кредит" : "кредити"}
            </span>
                    </div>
                </div>

                {/* Teachers */}
                <div className="course-card-teachers">
                    <span className="course-card-teachers-label">Викладачі:</span>
                    <span className="course-card-teachers-list">{course.teachers}</span>
                </div>

                {/* Skills */}
                <div className="course-card-skills">
                    {courseSkills.map(skill => (
                        <span key={skill} className="course-card-skill">{skill}</span>
                    ))}
                </div>

                {/* View More Button */}
                <div className="course-card-footer">
                    <a
                        className="course-card-toggle-button"
                        href={`/course/${course.discipline_Id}`} // Link to course details page with id
                    >
                        Детальніше
                        <ChevronRight
                            className={`course-card-chevron`}
                        />
                    </a>

                    <a
                        href={course.syllabus_link}
                        className="course-card-syllabus"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="course-card-download-icon"/>
                        Завантажити силабус
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CourseComponent;