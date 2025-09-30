import BaseUrl from "./BaseUrl";

export interface CurrentUser {
    id: string;
    username: string;
    email: string;
}

export async function getCurrentUserInfo(): Promise<CurrentUser | null> {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const response = await fetch(`${BaseUrl}me/`, {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch current user:", response.status);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching current user:", error);
    return null;
}}