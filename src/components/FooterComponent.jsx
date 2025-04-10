import React from 'react';
import {Link} from 'react-router-dom';
import './styles/Footer.css';
import {MessageCircle, Folder, Video, Database, Phone, MapPin, Mail} from 'lucide-react';

const FooterComponent = () => {
    return (
        <footer>
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-logo">
                        <Database size={40}/>
                        <h3>DBLAB</h3>
                    </div>
                    <div className="footer-links">
                        <h4>Навігація</h4>
                        <ul>
                            <li><Link to="/">Головна</Link></li>
                            <li><Link to="/courses">Дисципліни</Link></li>
                            <li><Link to="/schedule">Розклад</Link></li>
                            <li><Link to="/contact">Контакти</Link></li>
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h4>Контакти</h4>
                        <p><Mail size={20}/> dbclub@university.edu</p>
                        <p><Phone size={20}/> +38 (098) 456-78-90</p>
                        <p><MapPin size={20}/> Аудиторія 404</p>
                    </div>
                    <div className="footer-social">
                        <h4>Посилання</h4>
                        <div className="social-icons">
                            <div className="social-icons">
                                <Link to="#" title="test1"><MessageCircle size={30}/></Link>
                                <Link to="#" title="test2"><Folder size={30}/></Link>
                                <Link to="#" title="test3"><Video size={30}/></Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 Лабораторія розробки баз даних DBLAB. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default FooterComponent;