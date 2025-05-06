import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import "./styles/SchedulePage.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/uk";

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

const getEventStyle = (event, startHour = 7, endHour = 19) => {
    const style = {
        left: `${((event.datetime.day() + 6) % 7) / 7.0 * 98 + 1}%`,
        width: `${98 / 7.0}%`,
        top: `${(event.datetime.hour() + event.datetime.minute() / 60.0 - startHour) / (endHour - startHour) * 98 + 1}%`,
        height: `${(1 + 35 / 60.0) / (endHour - startHour) * 98}%`
    };
    return style;
};

const EventCard = ({ name, datetime, type, format, link, style, onClick }) => (
    <div className="event-card-container" style={style} onClick={onClick}>
        <div className={`event-card ${type}`}>
            <p className="event-card__name">{name}</p>
            <p className="event-card__type">{type === "regular" ? "регулярна" : "спеціальна"}</p>
            <p className="event-card__time">{datetime.format("HH:mm")} – {datetime.add(95, "minute").format("HH:mm")}</p>
        </div>
    </div>
);

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

const EventModal = ({ event, onClose }) => {
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    const formattedDate = event.datetime.format("dddd, DD.MM.YYYY");

    const timeStart = event.datetime.format("HH:mm");
    const timeEnd = event.datetime.add(95, "minute").format("HH:mm");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`event-modal ${event.type}`}
                onClick={handleModalClick}
            >
                <button className="event-modal__close-button" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2 className="event-modal__title">{event.name}</h2>

                <div className="event-modal__details">
                    <div className="event-modal__detail">
                        <span className="event-modal__label">Дата:</span>
                        <span className="event-modal__value">{formattedDate}</span>
                    </div>

                    <div className="event-modal__detail">
                        <span className="event-modal__label">Час:</span>
                        <span className="event-modal__value">{timeStart} – {timeEnd}</span>
                    </div>

                    <div className="event-modal__detail">
                        <span className="event-modal__label">Тип:</span>
                        <span className="event-modal__value">
                            {event.type === "regular" ? "Регулярна" : "Спеціальна"}
                        </span>
                    </div>

                    <div className="event-modal__detail">
                        <span className="event-modal__label">Формат:</span>
                        <span className="event-modal__value">
                            {event.format === "online" ? "Онлайн" : "Офлайн"}
                        </span>
                    </div>

                    <div className="event-modal__detail">
                        <span className="event-modal__label">Викладач:</span>
                        <span className="event-modal__value">{event.teacher_name}</span>
                    </div>
                </div>

                {event.format === "online" && (
                    <a
                        href={event.link}
                        className="event-modal__meet-button"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Приєднатися до зустрічі
                    </a>
                )}
            </div>
        </div>
    );
};

const SchedulePage = () => {
    const mockEvents = [
        {
            id: 1,
            name: "Лабортаорія розробки баз даних",
            date: "05.05.2025",
            time: "08:00",
            type: "regular",
            format: "online",
            teacher_name: "Іванов Іван Іванович",
            link: "https://meet.example.com/event-1"
        },
        {
            id: 2,
            name: "Тренінг з SQL",
            date: "05.05.2025",
            time: "10:30",
            type: "regular",
            format: "online",
            teacher_name: "Петрова Марія Василівна",
            link: "https://meet.example.com/event-2"
        },
        {
            id: 3,
            name: "Поглиблений курс NoSQL",
            date: "06.05.2025",
            time: "13:00",
            type: "special",
            format: "online",
            teacher_name: "Сидоренко Олексій Миколайович",
            link: "https://meet.example.com/event-3"
        },
        {
            id: 4,
            name: "Оптимізація запитів",
            date: "06.05.2025",
            time: "09:30",
            type: "regular",
            format: "online",
            teacher_name: "Коваленко Анна Сергіївна",
            link: "https://meet.example.com/event-4"
        },
        {
            id: 5,
            name: "Стратегії індексування",
            date: "07.05.2025",
            time: "11:00",
            type: "special",
            format: "online",
            teacher_name: "Мельник Павло Олегович",
            link: "https://meet.example.com/event-5"
        },
        {
            id: 6,
            name: "Міграція в хмарні БД",
            date: "07.05.2025",
            time: "14:00",
            type: "regular",
            format: "online",
            teacher_name: "Шевченко Тарас Григорович",
            link: "https://meet.example.com/event-6"
        },
        {
            id: 7,
            name: "Проектування схем даних",
            date: "08.05.2025",
            time: "15:30",
            type: "special",
            format: "online",
            teacher_name: "Боднаренко Ірина Володимирівна",
            link: "https://meet.example.com/event-7"
        },
        {
            id: 8,
            name: "Управління транзакціями",
            date: "09.05.2025",
            time: "16:00",
            type: "regular",
            format: "online",
            teacher_name: "Лисенко Сергій Петрович",
            link: "https://meet.example.com/event-8"
        },
        {
            id: 9,
            name: "Моделювання даних",
            date: "09.05.2025",
            time: "12:30",
            type: "special",
            format: "online",
            teacher_name: "Гончар Юлія Олександрівна",
            link: "https://meet.example.com/event-9"
        },
        {
            id: 10,
            name: "Налаштування продуктивності",
            date: "10.05.2025",
            time: "17:00",
            type: "regular",
            format: "online",
            teacher_name: "Савенко Дмитро Ігорович",
            link: "https://meet.example.com/event-10"
        }
    ];

    const [currentDate, setCurrentDate] = useState(dayjs());
    const startOfWeek = currentDate.startOf("week");
    const endOfWeek = currentDate.endOf("week");
    const [events, setEvents] = useState([]);
    const [currentWeekEvents, setCurrentWeekEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        setEvents(mockEvents.map(event => ({
            name: event.name,
            datetime: dayjs(
                `${event.date} ${event.time}`,
                "DD.MM.YYYY HH:mm"
            ),
            type: event.type,
            format: event.format,
            teacher_name: event.teacher_name,
            link: event.link,
        })));
    }, []);

    useEffect(() => {
        setCurrentWeekEvents(events.filter(event =>
            event.datetime.isAfter(startOfWeek.startOf("day"))
            && event.datetime.isBefore(endOfWeek.endOf("day"))
        ));
    }, [currentDate]);

    const weekDays = getWeekDays(currentDate);
    const hours = getHours();

    const prevWeek = () => {
        setCurrentDate(currentDate.subtract(1, "week"));
    };

    const nextWeek = () => {
        setCurrentDate(currentDate.add(1, "week"));
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const closeModal = () => {
        setSelectedEvent(null);
    };

    return (
        <div className="schedule-page">
            {selectedEvent && (
                <EventModal 
                    event={selectedEvent} 
                    onClose={closeModal}
                />
            )}
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
                        <div className="event-cards-layer">
                            {currentWeekEvents.map(event => {

                                return (
                                    <EventCard
                                        key={event.id}
                                        {...event}
                                        style={getEventStyle(event)}
                                        onClick={() => handleEventClick(event)}
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