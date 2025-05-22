import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/uk";

dayjs.extend(customParseFormat);
dayjs.locale("uk");

const Events = () => {
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [lessonOptions, setLessonOptions] = useState([]);

    const authToken = useAuthHeader().split(' ')[1];

    useEffect(() => {
        axios.get("http://localhost:5000/teacher/getFromDb", {
            headers: {
                'Authorization': authToken,
            }
        })
            .then(response => {
                setTeacherOptions(response.data.map(teacher => ({
                    id: teacher.teacher_Id,
                    name: teacher.full_name,
                })));
            })
            .catch(error => {
                console.error("Error fetching teachers:", error);
            });

        axios.get("http://localhost:5000/lesson/getFromDb", {
            headers: {
                'Authorization': authToken,
            }
        })
            .then(response => {
                setLessonOptions(response.data.map(lesson => {
                    const datetime = dayjs(
                        `${lesson.lesson_date} ${lesson.lesson_time}`,
                        "DD.MM.YYYY HH:mm:ss"
                    );

                    return {
                        id: lesson.lesson_Id,
                        name: `${lesson.name}, ${datetime.format("dd DD.MM.YYYY HH:mm")}`,
                        datetime,
                    };
                }).sort((a, b) => a.datetime.isBefore(b.datetime) ? -1 : a.datetime.isAfter(b.datetime)));
            })
            .catch(error => {
                console.error("Error fetching lessons:", error);
            })
    }, []);

    const formatOptions = [
        { id: "online", name: "Онлайн" },
        { id: "offline", name: "Офлайн" },
    ];

    const columns = [
        { key: "event_Id", title: "ID" },
        { key: "event_name", title: "Назва" },
        { key: "teacher_Id", title: "Викладач", type: "select", options: teacherOptions, hidden: true },
        { key: "teacher_name", title: "Викладач", modalHidden: true },
        { key: "lesson_Id", title: "Заняття", type: "select", options: lessonOptions, hidden: true },
        { key: "lesson_desc", title: "Заняття", modalHidden: true },
        { key: "type", title: "Тип" },
        { key: "format", title: "Формат", type: "select", options: formatOptions },
        { key: "begin_date", title: "Дата початку" },
        { key: "status", title: "Статус" },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Подія"}
                columns={columns}
                endpoint={"event"}
                idField={"event_Id"}
            />
        </div>
    )
};

export default Events;