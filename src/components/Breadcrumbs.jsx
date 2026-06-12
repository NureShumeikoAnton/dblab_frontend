import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './styles/Breadcrumbs.css'; // Стилі створимо нижче

const Breadcrumbs = () => {
    const location = useLocation();
    
    // Словник для перекладу шляхів на зрозумілу мову
    const routeNameMap = {
        'dashboard': 'Особистий кабінет',
        'studentproposals': 'Вибір пропозиції',
        'work': 'Робота',
        'my-works': 'Мої роботи',
        'login': 'Вхід',
        'register': 'Реєстрація'
    };

    let currentLink = '';
    
    // Розбиваємо шлях на частини (фільтруємо пусті)
    const crumbs = location.pathname.split('/').filter(crumb => crumb !== '');

    // Якщо ми на головній - не показуємо крихти
    if (crumbs.length === 0) return null;

    return (
        <div className="breadcrumbs">
            <Link to="/" className="crumb-link">
                <Home size={16} />
            </Link>
            
            {crumbs.map((crumb, index) => {
                currentLink += `/${crumb}`;
                const isLast = index === crumbs.length - 1;
                
                // Якщо це ID (число), то не перекладаємо, а пишемо "ID: ..."
                const displayName = !isNaN(crumb) 
                    ? `#${crumb}` 
                    : routeNameMap[crumb] || crumb;

                return (
                    <div className="crumb" key={crumb}>
                        <ChevronRight size={16} className="crumb-separator" />
                        {isLast ? (
                            <span className="crumb-active">{displayName}</span>
                        ) : (
                            <Link to={currentLink} className="crumb-link">
                                {displayName}
                            </Link>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Breadcrumbs;