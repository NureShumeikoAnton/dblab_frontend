import { X, FileText, Film, Image, FileCode, FileSpreadsheet } from "lucide-react";
import dayjs from "dayjs";
import "./styles/EventModal.css";

const EventModalComponent = ({ event, onClose }) => {
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "";
    
    return dayjs(dateTimeString).format("dddd, DD.MM.YYYY");
  };
  
  const formatTimeRange = (dateTimeString) => {
    if (!dateTimeString) return "";
    
    const startTime = dayjs(dateTimeString);
    const endTime = startTime.add(95, 'minute');
    
    return `${startTime.format("HH:mm")} – ${endTime.format("HH:mm")}`;
  };

  const getMaterialIcon = (materialType) => {
    switch (materialType?.toLowerCase()) {
      case 'presentation':
        return <Film size={16} />;
      case 'image':
        return <Image size={16} />;
      case 'code':
        return <FileCode size={16} />;
      case 'spreadsheet':
        return <FileSpreadsheet size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="event-modal" 
        onClick={handleModalClick}
      >
        <button className="event-modal__close-button" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="event-modal__title">{event.event_name}</h2>
        
        <div className="event-modal__details">
          <div className="event-modal__detail">
            <span className="event-modal__label">Дата:</span>
            <span className="event-modal__value">{formatDate(event.begin_date)}</span>
          </div>
          
          <div className="event-modal__detail">
            <span className="event-modal__label">Час:</span>
            <span className="event-modal__value">{formatTimeRange(event.begin_date)}</span>
          </div>
          
          <div className="event-modal__detail">
            <span className="event-modal__label">Тип:</span>
            <span className="event-modal__value">{event.type}</span>
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
          
          <div className="event-modal__detail">
            <span className="event-modal__label">Статус:</span>
            <span className="event-modal__value event-status">
              <span className={`status-indicator status-${event.status?.toLowerCase()}`}></span>
              {event.status}
            </span>
          </div>
        </div>
        
        {event.materials && event.materials.length > 0 && (
          <div className="event-modal__materials">
            <h3 className="materials-heading">Матеріали:</h3>
            <div className="materials-list">
              {event.materials.map((material) => (
                <a 
                  key={material.material_Id}
                  href={material.file} 
                  className="material-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getMaterialIcon(material.material_type)}
                  <span>{material.material_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModalComponent;