import React from 'react';

const CourseDetailsPage = () => {
    return (
        <div>
            <div className="course-header-container">
                <div className="stars-bar">
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                    <div className="star" style={{width: '25%', backgroundColor: '#FFD700', height: '10px'}}></div>
                </div>
                <h1></h1>
                <h2></h2>
                <div className="course-additional-info-container">
                    <div className="course-type"></div>
                    <div className="course-value"></div>
                </div>
            </div>
            <div className="course-details-container">
                <div className="course-description-container">
                    <h3>Description</h3>
                    <p></p>
                </div>
                <div className="course-content-container">
                    <div className="course-teacher-container">
                        <h3>Teachers</h3>
                        <div className="course-teacher-slider">

                        </div>
                        
                    </div>
                </div>
            </div>
            <div className="course-footer-container">

            </div>
        </div>
    );
};

export default CourseDetailsPage;