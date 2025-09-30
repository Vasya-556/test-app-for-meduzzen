import { useState, useEffect } from "react";

export function useIsLoggedIn() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return { isLoggedIn, logout };
}