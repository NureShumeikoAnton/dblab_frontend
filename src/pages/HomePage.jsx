import './styles/HomePage.css'
import { Video } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import API_CONFIG from '../config/api.js';

const SkillCard = ({ id, name }) => (
    <Link to={`/studentproposals?directionId=${id}`} className='skill-card-link'>
        <div className='skill-card'>
            <p className='skill-card__name'>{name}</p>
        </div>
    </Link>
);

const DirectionCard = ({ name, link, description }) => (
    <a href={link} className='direction-card'>
        <p className='direction-card__name'>{name}</p>
        <p className='direction-card__description'>{description}</p>
    </a>
)

const ExpertCard = ({ name, role, image, position, placeOfEmployment, level, description }) => {
    let imageSrc = "#";
    if (image != null) {
        imageSrc = Array.from(new Uint8Array(image.data))
            .map(byte => String.fromCharCode(byte)).join('');
    }
    return (
        <div className='expert-card'>
            <p className='expert-card__role'>{role}</p>
            {image != null && <img src={imageSrc} alt={name} className='expert-card__img' />}
            {image == null && <div className='expert-card__img'></div>}
            <p className='expert-card__name'>{name}</p>
            {(position || placeOfEmployment) &&
                <p className='expert-card__employment'>
                    <span className='expert-card__position'>{position}</span>
                    {(position ? '' : 'Працює') + (placeOfEmployment ? ' у ' : '')}
                    {placeOfEmployment &&
                        <span className='expert-card__place-of-employment'>{placeOfEmployment}</span>
                    }
                </p>
            }
            <p className='expert-card__level'>{level}</p>
            <p className='expert-card__description'>{description}</p>
        </div>
    );
}

const HomePage = () => {
    const [skills, setSkills] = useState([]);
    const [directions, setDirections] = useState([]);
    const [experts, setExperts] = useState([]);

    useEffect(() => {
        // 1. Skills (Directions from DB) - виводимо напрями з найбільшою кількістю пропозицій
        Promise.all([
            axios.get(`${API_CONFIG.BASE_URL}/direction/getall`),
            axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`)
        ])
            .then(([dirRes, propRes]) => {
                const proposalCounts = {};
                propRes.data.forEach(prop => {
                    if (prop.direction_Id) {
                        proposalCounts[prop.direction_Id] = (proposalCounts[prop.direction_Id] || 0) + 1;
                    }
                });
                const sortedDirections = dirRes.data
                    .map(skill => ({
                        id: skill.direction_Id,
                        name: skill.name,
                        proposalCount: proposalCounts[skill.direction_Id] || 0
                    }))
                    .filter(skill => skill.proposalCount > 0)
                    .sort((a, b) => b.proposalCount - a.proposalCount);

                setSkills(sortedDirections);
            })
            .catch(error => {
                console.error("Error fetching skills:", error);
            });

        axios.get(`${API_CONFIG.BASE_URL}/developmentDirection/getall`)
            .then(response => {
                setDirections(response.data.slice(0, 4).map(direction => ({
                    id: direction.development_direction_Id,
                    name: direction.development_direction_name,
                    link: `/directions/${direction.development_direction_Id}`,
                    description: direction.development_direction_Description,
                })));
            })
            .catch(error => {
                console.error("Error fetching directions:", error);
            });

        axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`)
            .then(response => {
                setExperts(response.data.map(teacher => ({
                    id: teacher.teacher_Id,
                    name: teacher.full_name,
                    role: teacher.teacher_role,
                    image: teacher.photo,
                    position: teacher.position,
                    placeOfEmployment: teacher.place_of_Employment,
                    level: teacher.level,
                    description: teacher.text,
                })));
            })
            .catch(error => {
                console.error("Error fetching experts:", error)
            });
    }, []);

    return (
        <div className='home-page'>
            <section className='dblab-presentation'>
                <h2>Студентський науковий гурток</h2>
                <h1 className='dblab-presentation__db-dev-lab'>Лабораторія розробки баз даних DBLAB</h1>
                <p>Запрошує бакалаврів та магістрів приєднатися до захопливого світу</p>
                <p className='dblab-presentation__databases-caps'>БАЗ ДАНИХ!</p>

                <div className='dblab-presentation__buttons'>
                    <a className='dblab-presentation__button dblab-presentation__meet-button'
                        href='https://meet.google.com'
                        target='_blank'>
                        <Video />
                        Приєднатися до відеозустрічі
                    </a>
                    <a className='dblab-presentation__button dblab-presentation__skills-button'
                        href='/courses'>
                        Переглянути дисципліни
                    </a>
                </div>
            </section>
            
            <section className='info'>
                <h3 className='info__heading'>
                    Інформація про гурток
                </h3>
                <p className='info__paragraph'>
                    Запрошуємо бакалаврів та магістрів спеціальності F2 (121) –
                    Інженерія програмного забезпечення приєднатися до
                    захопливого світу БАЗ ДАНИХ!
                </p>
                <br className='info__spacing' />
                <p className='info__paragraph'>
                    Під час роботи гуртка Ви зможете:
                </p>
                <ul className='info__list'>
                    <li className='info__list-item'>
                        опанувати методи проектування баз даних на основі різних моделей даних;
                    </li>
                    <li className='info__list-item'>
                        набути навички розробки високопродуктивних баз даних;
                    </li>
                    <li className='info__list-item'>
                        отримати якісну експертизу свого проекту БД або прийняти участь в
                        експертизі студентських проектів баз даних;
                    </li>
                    <li className='info__list-item'>
                        набути досвід реінжинірингу баз даних та застосунків на їх основі;
                    </li>
                    <li className='info__list-item'>
                        дослідити функціональні особливості та ефективність застосування
                        реляційних, NoSQL та інших СУБД.
                    </li>
                </ul>
                <br className='info__spacing' />
                <p className='info__paragraph'>
                    Графік роботи – понеділок, щотижня, 6 пара.
                </p>
                <br className='info__spacing' />
                <p className='info__paragraph'>
                    Місце роботи студентського наукового гуртка – комп’ютерний клас
                    кафедри ПІ (ауд. № 287 головного корпусу), під час воєнного
                    стану працюємо дистанційно.
                </p>

                <h3 className='info__heading'>
                    Приєднавшись ти дізнаєшся про:
                </h3>
                <div className='info__skills-container'>
                    <Slider {...{
                        arrows: skills.length > 5,
                        slidesToShow: 5,
                        infinite: skills.length > 5,
                        dots: false,
                        centerMode: true,
                        centerPadding: 0,
                        touchMove: false,
                        swipe: false,
                        draggable: false,
                    }}>
                        {skills.map(skill => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </Slider>
                </div>

                {/* Кнопка веде на сторінку всіх напрямів */}
                <Link to="/studentdirections" className='directions__all-directions-button'>
                    Усі напрями роботи гуртка
                </Link>
            </section>

            <section className='directions'>
                <h3 className='directions__heading'>
                    Обери свій напрям професійного розвитку з базами даних
                </h3>
                <div className='directions__directions-container'>
                    {directions.map(direction => (
                        <DirectionCard key={direction.id} {...direction} />
                    ))}
                </div>

                <a href="/directions" className='directions__all-directions-button'>
                    Усі напрями розвитку
                </a>
            </section>
            <section className='experts'>
                <h3 className='experts__heading'>
                    Наукові керівники та запрошені експерти
                </h3>
                <div className='experts__experts-container'>
                    <Slider {...{
                        arrows: experts.length > 3,
                        slidesToShow: 3,
                        infinite: experts.length > 3,
                        dots: experts.length > 3,
                        centerMode: true,
                        centerPadding: 0,
                        touchMove: false,
                        swipe: false,
                        draggable: false,
                    }}>
                        {experts.map(expert => (
                            <ExpertCard key={expert.id} {...expert} />
                        ))}
                    </Slider>
                </div>
            </section>
        </div>
    )
};

export default HomePage;