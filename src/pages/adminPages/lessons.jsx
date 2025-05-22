import AdminTableComponent from "../../components/AdminTableComponent.jsx";

const Lessons = () => {
    const repeatOptions = [
        { id: 0, name: "Не повторювати" },
        { id: 7, name: "Щотижня" },
        { id: 14, name: "Що два тижні" },
    ];
    const columns = [
        { key: "lesson_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "lesson_date", title: "Дата" },
        { key: "lesson_time", title: "Час" },
        { key: "link", title: "Посилання на зустріч" },
        { key: "repeat", title: "Повторювати", type: "select", options: repeatOptions, hidden: true, disabledOnEdit: true },
        { key: "end_date", title: "Дата закінчення", hidden: true, disabledOnEdit: true },
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Заняття"}
                columns={columns}
                endpoint={"lesson"}
                idField={"lesson_Id"}
            />
        </div>
    )
};

export default Lessons;