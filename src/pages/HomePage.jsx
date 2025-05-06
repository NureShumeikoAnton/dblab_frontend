import React from 'react';
import './styles/HomePage.css'
import { Video } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function MultipleItems() {
    return (
      <div className="slider-container">
        <Slider {...{
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 3,
      slidesToScroll: 1
    }}>
          <ExpertCard {...{
            id: 1,
            name: "Мазурова Оксана Олексіївна",
            image: "#",
            titles: "Доцент кафедри програмної інженерії, кандидат технічних наук, вчений секретар кафедри",
            description: "Керівник гуртка, експерт в області проєктування баз даних",
        }}/>
          <div>
            <h3>2</h3>
          </div>
          <div>
            <h3>3</h3>
          </div>
          <div>
            <h3>4</h3>
          </div>
          <div>
            <h3>5</h3>
          </div>
          <div>
            <h3>6</h3>
          </div>
          <div>
            <h3>7</h3>
          </div>
          <div>
            <h3>8</h3>
          </div>
          <div>
            <h3>9</h3>
          </div>
        </Slider>
      </div>
    );
  }

const SkillCard = ({ name, image }) => (
    <div className='skill-card'>
        {/*<img src={image} alt={name} className='skill-card__img'/>*/}
        <div className='skill-card__img'></div>
        <p className='skill-card__name'>{name}</p>
    </div>
);

const DirectionCard = ({ name, link, image, description }) => (
    <a href={link} className='direction-card'>
        {/*<img src={image} alt={name} className='direction-card__img'/>*/}
        <div className='direction-card__img'></div>
        <p className='direction-card__name'>{name}</p>
        <p className='direction-card__description'>{description}</p>
    </a>
)

const ExpertCard = ({ name, image, titles, description }) => (
    <div className='expert-card'>
        {/*<img src={image} alt={name} className='expert-card__img'/>*/}
        <div className='expert-card__img'></div>
        <p className='expert-card__name'>{name}</p>
        <p className='expert-card__titles'>{titles}</p>
        <p className='expert-card__description'>{description}</p>
    </div>
)

const HomePage = () => {
    // const skills = [
    //     {
    //         id: 1,
    //         name: "Моделювання БД",
    //         image: "#",
    //     },
    //     {
    //         id: 2,
    //         name: "Навичка 2",
    //         image: "#",
    //     },
    //     {
    //         id: 3,
    //         name: "Навичка 3",
    //         image: "#",
    //     },
    //     {
    //         id: 4,
    //         name: "Навичка 4",
    //         image: "#",
    //     },
    // ];
    // const directions = [
    //     {
    //         id: 1,
    //         name: "SQL",
    //         link: "#",
    //         image: "#",
    //         description: "SQL is that thing and it does those things",
    //     },
    //     {
    //         id: 2,
    //         name: "Direction 2",
    //         link: "#",
    //         image: "#",
    //         description: "Direction 2 is that thing and it does those things",
    //     },
    //     {
    //         id: 3,
    //         name: "Direction 3",
    //         link: "#",
    //         image: "#",
    //         description: "Direction 3 is that thing and it does those things",
    //     },
    //     {
    //         id: 4,
    //         name: "Direction 4",
    //         link: "#",
    //         image: "#",
    //         description: "Direction 4 is that thing and it does those things",
    //     },
    // ];
    // const experts = [
    //     {
    //         id: 1,
    //         name: "Мазурова Оксана Олексіївна",
    //         image: "#",
    //         titles: "Доцент кафедри програмної інженерії, кандидат технічних наук, вчений секретар кафедри",
    //         description: "Керівник гуртка, експерт в області проєктування баз даних",
    //     },
    //     {
    //         id: 2,
    //         name: "Широкопетлєва Марія Сергіївна",
    //         image: "#",
    //         titles: "Старший викладач кафедри програмної інженерії, заступник директора центру післядипломної освіти",
    //         description: "Керівник гуртка, експерт в області інформаційних систем",
    //     },
    //     {
    //         id: 3,
    //         name: "Expert 3",
    //         image: "#",
    //         titles: "Title one, title two",
    //         description: "A description of Expert 3 which mentions who they are and what is their primary fiels of study",
    //     }
    // ];

    const [skills, setSkills] = useState([]);
    const [directions, setDirections] = useState([]);
    const [experts, setExperts] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/developmentDirection/getall")
            .then(response => {
                setDirections(response.data.slice(0, 4).map(direction => ({
                    id: direction.development_direction_Id,
                    name: direction.development_direction_name,
                    link: `/directions/${direction.development_direction_Id}`,
                    image: "#",
                    description: direction.development_direction_Description,
                })));
            })
            .catch(error => {
                console.error("Error fetching directions:", error);
            });

        axios.get("http://localhost:5000/teacher/getall")
            .then(response => {
                setExperts(response.data.map(teacher => ({
                    id: teacher.teacher_Id,
                    name: teacher.full_name,
                    image: teacher.photo,
                    titles: teacher.position,
                    description: teacher.text,
                })));
            })
            .catch(error => {
                console.error("Error fetching experts:", error)
            });

        axios.get("http://localhost:5000/skill/getall")
            .then(response => {
                setSkills(response.data.map(skill => ({
                    id: skill.skill_Id,
                    name: skill.skill_name,
                    image: "#",
                })));
            })
            .catch(error => {
                console.error("Error fetching skills:", error)
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
                    <Slider {...{
                        arrows: skills.length > 4,
                        slidesToShow: 4,
                        infinite: skills.length > 4,
                        dots: skills.length > 4,
                        centerMode: true,
                        centerPadding: 0,
                    }}>
                        {skills.map(skill => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </Slider>
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