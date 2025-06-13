import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import Slider from "react-slick";
import dayjs from "dayjs";
import "./styles/LessonCard.css";
import EventModalComponent from "./EventModalComponent";

const LessonCardComponent = ({ lesson, style }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const sliderRef = useRef(null);

  const formatTime = (datetime) => {
    if (!datetime) return "";
    return `${datetime.format("HH:mm")} – ${datetime.add(95, "minutes").format("HH:mm")}`;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: false,
    touchMove: false,

    centerMode: true,
    centerPadding: "0px",
  };

  const handleLessonClick = (e) => {
    if (e.target.closest('.event-item') || e.target.closest('.slick-arrow')) {
      e.stopPropagation();
      return;
    }
    
    if (lesson.link) {
      window.open(lesson.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="lesson-card-container" style={style}>
      {selectedEvent && (
        <EventModalComponent 
          event={{...selectedEvent, lesson_date: lesson.datetime}} 
          onClose={closeModal} 
        />
      )}
      
      <div className="lesson-card" onClick={handleLessonClick}>
        <div className="lesson-card__header">
          <h3 className="lesson-card__name">{lesson.name}</h3>
        </div>
        
        <div className="lesson-card__content">
          {lesson.events && lesson.events.length > 0 ? (
            <div className="lesson-card__carousel">
              <Slider ref={sliderRef} {...sliderSettings}>
                {lesson.events.map((event) => (
                  <div key={event.event_Id} className="carousel-slide">
                    <div 
                      className="event-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <p className="event-item__name">{event.event_name}</p>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <p className="lesson-card__no-events">Немає подій</p>
          )}
        </div>
        <p className="lesson-card__time">{formatTime(lesson.datetime)}</p>
        {lesson.link && (
          <div className="lesson-card__link-indicator">
            <ExternalLink size={16} />
            <span>Приєднатися до зустрічі</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCardComponent;