import { useEffect, useState } from "react";
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import axios from "axios";

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            axios.get("http://localhost:3000/api/v1/user/balance", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                setBalance(response.data.balance);
            })
            .catch((err) => {
                console.error("Error fetching balance:", err);
                setBalance("Error");
            });
        }
    }, []);


    return <div>
        <Appbar />
        <div className="m-8">
            <Balance value={balance !== null ? balance.toLocaleString() : "Loading..."} />
            <Users />
        </div>
    </div>
}