import React, { useState, useEffect} from 'react'
import { useIsLoggedIn} from '../isLoggedIn'
import BaseUrl from '../utils/BaseUrl';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserInfo } from "../utils/getCurrentUserInfo";

interface User {
    id: string;
    username: string;
}

function Home() {
    // eslint-disable-next-line
    const { isLoggedIn, logout } = useIsLoggedIn();
    const [users, setUsers] = useState<User[]>([]);
    const navigate = useNavigate();
    const [thisUserId, setThisUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${BaseUrl}users/`, {});
                const data: User[] = await response.json();
                setUsers(data);
            } catch (error) {
                console.log(error);
            }
        };
        
        const fetchThisUser = async () => {
        const user = await getCurrentUserInfo();
        if (user) setThisUserId(user.id);
        };
    
        fetchThisUser();

        
        if (isLoggedIn) {
            fetchThisUser();
            fetchUsers();
        }
    }, [isLoggedIn])

    const handleChatClick = (userId: string) => {
        navigate(`/chat/${userId}`)
    }
    
  return (
    <div className="max-w-lg mx-auto mt-8">
        {isLoggedIn? 
        <>
            <h2 className="text-xl font-semibold mb-2">All Users:</h2>
            <ul className="space-y-2">
                {users.map(user => 
                    user.id !== thisUserId && (
                    <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                        <p>{user.username}</p>
                        <button 
                        onClick={() => handleChatClick(user.id)} 
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                        Chat
                        </button>
                    </div>
                    )
                )}
            </ul>
        </>:
        <>
            <h1 className="text-center text-gray-700">Welcome! You need to log in to start chat</h1>
        </>}
    </div>
  )
}

export default Home