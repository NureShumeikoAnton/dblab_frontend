import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const ResultType = () => {
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/resultType/getall`, {
            headers: {
                'Authorization': authHeader,
            }
        })
        .catch(error => {
            console.error("Error fetching result types:", error);
        });
    }, []);

    const columns = [
        { key: "result_type_Id", title: "ID" },
        { key: "name", title: "Назва" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Типи результатів"}
                columns={columns}
                endpoint={"resultType"}
                idField={"result_type_Id"}
            />
        </div>
    );
};

export default ResultType;