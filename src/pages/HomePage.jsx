import React from 'react';
import './styles/HomePage.css'
import { Video } from 'lucide-react';

const SkillCard = ({name, image}) => (
    <div className='skill-card'>
        {/*<img src={image} alt={name} className='skill-card__img'/>*/}
        <div className='skill-card__img'></div>
        <p className='skill-card__name'>{name}</p>
    </div>
);

const DirectionCard = ({name, link, image, description}) => (
    <a href={link} className='direction-card'>
        {/*<img src={image} alt={name} className='direction-card__img'/>*/}
        <div className='direction-card__img'></div>
        <p className='direction-card__name'>{name}</p>
        <p className='direction-card__description'>{description}</p>
    </a>
)

const HomePage = () => {
    const skills = [
        {
            id: 1,
            name: "Моделювання БД",
            image: "#",
        },
        {
            id: 2,
            name: "Навичка 2",
            image: "#",
        },
        {
            id: 3,
            name: "Навичка 3",
            image: "#",
        },
        {
            id: 4,
            name: "Навичка 4",
            image: "#",
        },
    ];
    const directions = [
        {
            id: 1,
            name: "SQL",
            link: "#",
            image: "#",
            description: "SQL is that thing and it does those things",
        },
        {
            id: 2,
            name: "Direction 2",
            link: "#",
            image: "#",
            description: "Direction 2 is that thing and it does those things",
        },
        {
            id: 3,
            name: "Direction 3",
            link: "#",
            image: "#",
            description: "Direction 3 is that thing and it does those things",
        },
        {
            id: 4,
            name: "Direction 4",
            link: "#",
            image: "#",
            description: "Direction 4 is that thing and it does those things",
        },
    ];
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
                        Переглянути навички
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
                    {skills.map(skill => (
                        <SkillCard key={skill.id} {...skill} />
                    ))}
                </div>
            </section>
            <section className='directions'>
                <h3 className='directions__heading'>
                    Напрями розвитку
                </h3>
                <div className='directions__directions-container'>
                    {directions.map(direction => (
                        <DirectionCard key={direction.id} {...direction} />
                    ))}
                </div>
                <a href="/directions" className='directions__all-directions-button'>
                    Усі напрями
                </a>
            </section>
        </div>
    )
};

export default HomePage;