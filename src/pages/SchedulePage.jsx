import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import "./styles/SchedulePage.css";
import LessonCardComponent from "../components/LessonCardComponent";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/uk";
import axios from "axios";
import API_CONFIG from '../config/api.js';

dayjs.extend(customParseFormat);
dayjs.locale("uk");

const DAYS_IN_WEEK = 7;

const getWeekDays = (date) => {
    const weekDays = [];
    let day = date.startOf("week");

    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        weekDays.push(day);
        day = day.add(1, 'day');
    }

    return weekDays;
};

const getHours = (startHour = 7, endHour = 19) => {
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
        return dayjs()
            .hour(startHour + i)
            .minute(0)
            .second(0)
            .millisecond(0);
    });
};

const getLessonStyle = (lesson, startHour = 7, endHour = 19) => {
    const style = {
        left: `${((lesson.datetime.day() + 6) % 7) / 7.0 * 98 + 1}%`,
        width: `${98 / 7.0}%`,
        top: `${(lesson.datetime.hour() + lesson.datetime.minute() / 60.0 - startHour) / (endHour - startHour) * 98 + 1}%`,
        height: `${(1 + 35 / 60.0) / (endHour - startHour) * 98}%`
    };
    return style;
};

const ScheduleGrid = ({ startHour = 7, endHour = 19 }) => {
    const FIRST_VERTICAL = 1;
    const LAST_VERTICAL = 99;
    const FIRST_HORIZONTAL = 1;
    const LAST_HORIZONTAL = 99;
    const STROKE_WIDTH = 0.3;

    return (
        <svg
            className="schedule-grid-lines"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
        >
            {Array.from({ length: 8 }, (_, i) => (
                <path
                    key={`vertical-${i}`}
                    d={`M ${FIRST_VERTICAL + i * ((LAST_VERTICAL - FIRST_VERTICAL) / 7.0)} ${FIRST_HORIZONTAL} v ${LAST_HORIZONTAL - FIRST_HORIZONTAL}`}
                    stroke="#ddd"
                    strokeWidth={STROKE_WIDTH}
                />
            ))}

            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                <path
                    key={`horizontal-${i}`}
                    d={`M ${FIRST_VERTICAL} ${FIRST_HORIZONTAL + i * ((LAST_HORIZONTAL - FIRST_HORIZONTAL) / (endHour * 1.0 - startHour))} h ${LAST_VERTICAL - FIRST_VERTICAL}`}
                    stroke="#ddd"
                    strokeWidth={STROKE_WIDTH}
                />
            ))}
        </svg>
    );
};

const SchedulePage = () => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const startOfWeek = currentDate.startOf("week").startOf("day");
    const endOfWeek = currentDate.endOf("week").endOf("day");
    const [lessons, setLessons] = useState([]);
    const [cachedFrom, setCachedFrom] = useState(null);
    const [cachedTo, setCachedTo] = useState(null);
    const [currentWeekLessons, setCurrentWeekLessons] = useState([]);

    useEffect(() => {
        setCurrentDate(dayjs());
    }, []);

    useEffect(() => {
        if (cachedFrom !== null && cachedTo !== null
            && currentDate.isAfter(cachedFrom) && currentDate.isBefore(cachedTo)) {
                console.log("cached");
            return;
        }
        axios.get(`${API_CONFIG.BASE_URL}/lesson/getLessonsBetweenDates`
            + `?start_date=${startOfWeek.format("DD.MM.YYYY")}`
            + `&end_date=${endOfWeek.format("DD.MM.YYYY")}`)
            .then(response => {
                const newLessons = response.data.map(lesson => ({
                    ...lesson,
                    datetime: dayjs(`${lesson.lesson_date} ${lesson.lesson_time}`, "DD.MM.YYYY HH:mm"),
                }));
                setLessons(prevLessons => {
                    const lessonMap = [...prevLessons, ...newLessons].reduce((acc, lesson) => {
                        acc[lesson.lesson_Id] = lesson;
                        return acc;
                    }, {});
                    return Object.values(lessonMap);
                });
                if (cachedFrom === null || cachedFrom.isAfter(startOfWeek)) {
                    setCachedFrom(startOfWeek);
                }
                if (cachedTo === null || cachedTo.isBefore(endOfWeek)) {
                    setCachedTo(endOfWeek);
                }
            })
            .catch(error => {
                console.error("Error fetching lessons:", error);
            });
    }, [currentDate]);

    useEffect(() => {
        setCurrentWeekLessons(lessons.filter(lesson =>
            lesson.datetime.isAfter(startOfWeek)
            && lesson.datetime.isBefore(endOfWeek)
        ));
    }, [lessons, currentDate]);

    const weekDays = getWeekDays(currentDate);
    const hours = getHours();

    const prevWeek = () => {
        setCurrentDate(currentDate.subtract(1, "week"));
    };

    const nextWeek = () => {
        setCurrentDate(currentDate.add(1, "week"));
    };

    return (
        <div className="schedule-page">
            <h1 className="schedule-page__heading">
                Розклад роботи Лабораторії розробки баз даних DBLAB
            </h1>
            <div className="controls">
                <button className="controls__button left" onClick={prevWeek}><ChevronLeft size={32} /></button>
                <div className="controls__current-week">
                    {startOfWeek.format("DD.MM")} – {endOfWeek.format("DD.MM.YYYY")}
                </div>
                <button className="controls__button right" onClick={nextWeek}><ChevronRight size={32} /></button>
            </div>
            <div className="schedule-view">
                <div className="day-labels">
                    {weekDays.map(weekDay => (
                        <div className="day-label" key={weekDay.toString()}>
                            <p className="day-label__day">
                                {weekDay.format("DD")}
                            </p>
                            <p className="day-label__weekday">
                                {weekDay.format("dd")}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="schedule-grid-container">
                    <div className="time-labels">
                        {hours.map(hour => (
                            <p className="time-label" key={hour.toString()}>
                                {hour.format("HH:mm")}
                            </p>
                        ))}
                    </div>
                    <div className="schedule-grid-frame">
                        <div className="lesson-cards-layer">
                            {currentWeekLessons.map(lesson => {

                                return (
                                    <LessonCardComponent
                                        key={lesson.lesson_Id}
                                        lesson={lesson}
                                        style={getLessonStyle(lesson)}
                                    />
                                )
                            })}
                        </div>
                        <div className="schedule-grid-layer">
                            <ScheduleGrid />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;