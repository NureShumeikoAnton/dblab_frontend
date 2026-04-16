import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Direction = () => {
    const [directionOptions, setDirectionOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/direction/getall`, {
            headers: {
                'Authorization': authHeader,
            }
        })
        .then(response => {
            const options = response.data.map(direction => ({
                id: direction.direction_Id,
                name: direction.name
            }));
            setDirectionOptions(options);
        })
        .catch(error => {
            console.error("Error fetching directions:", error);
        });
    }, []);

    const columns = [
        { key: "direction_Id", title: "ID" },
        { key: "name", title: "Назва" },
        { key: "description", title: "Опис", type: "textarea", note: "Max length is 2000 symbols" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Напрямки"}
                columns={columns}
                endpoint={"direction"}
                idField={"direction_Id"}
            />
        </div>
    );
};

export default Direction;