import React, { useState, useEffect} from 'react'
import { useIsLoggedIn} from '../isLoggedIn'
import BaseUrl from '../BaseUrl';
import { Navigate, useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
}

function Home() {
    const { isLoggedIn, logout } = useIsLoggedIn();
    const [users, setUsers] = useState<User[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
        try {
            const response = await fetch(`${BaseUrl}users/`, {});
            const data: User[] = await response.json();
            setUsers(data);
            console.log(data);
        } catch (error) {
            console.log(error);
        }
        };

        if (isLoggedIn) {
        fetchUsers();
        }
    }, [isLoggedIn])

    const handleChatClick = (userId: string) => {
        navigate(`/chat/${userId}`)
    }
    
  return (
    <div>
        {isLoggedIn? 
        <>
            <h2>All Users:</h2>
            <ul>
                {users.map(user => (
                    <>
                        <p key={user.id}>{user.username}</p>
                        <button onClick={() => handleChatClick(user.id)}>chat</button>
                    </>
                ))}
            </ul>
        </>:
        <>
            <h1>Welcome! You need to log in to start chat</h1>
        </>}
    </div>
  )
}

export default Home