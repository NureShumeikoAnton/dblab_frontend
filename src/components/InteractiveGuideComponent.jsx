import React from 'react';
import './styles/InteractiveGuideComponent.css';

const steps = [
    {
        number: '01',
        title: 'Створіть проект',
        desc: 'Дайте назву та опис. Проект — це контейнер верхнього рівня для однієї або кількох схем баз даних.',
    },
    {
        number: '02',
        title: 'Побудуйте схему',
        desc: 'Додайте таблиці, визначте стовпці з типами даних та накресліть зв\'язки на візуальному полотні.',
    },
    {
        number: '03',
        title: 'Нормалізуйте крок за кроком',
        desc: 'Пройдіть 1НФ → 2НФ → 3НФ з підказками, які автоматично виявляють порушення.',
    },
];

const InteractiveGuideComponent = () => (
    <aside className="iguide">
        <div className="iguide__header">
            <span className="iguide__badge">Як це працює</span>
            <p className="iguide__tagline">
                Проектуйте, нормалізуйте та експортуйте схему бази даних — все в одному місці.
            </p>
        </div>
        <div className="iguide__steps">
            {steps.map((s, i) => (
                <div className="iguide__step" key={i}>
                    <div className="iguide__step-num">{s.number}</div>
                    <div className="iguide__step-content">
                        <strong className="iguide__step-title">{s.title}</strong>
                        <span className="iguide__step-desc">{s.desc}</span>
                    </div>
                </div>
            ))}
        </div>
    </aside>
);

export default InteractiveGuideComponent;
