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
    <div>
        {isLoggedIn? 
        <>
            <h2>All Users:</h2>
            <ul>
                {users.map(user => (
                    <div key={user.id}>
                        {user.id !== thisUserId? <>
                            <p>{user.username}</p>
                            <button onClick={() => handleChatClick(user.id)}>chat</button>
                        </>: <></>}
                    </div>
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