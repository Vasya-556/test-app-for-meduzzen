import React, {useState, useEffect} from 'react'
import { Link } from 'react-router-dom';
import { useIsLoggedIn} from '../isLoggedIn'
import { getCurrentUserInfo } from "../utils/getCurrentUserInfo";

interface User {
    id: string;
    username: string;
}

function Header() {
    const { isLoggedIn, logout } = useIsLoggedIn();
    const [thisUserInfo, setThisUserInfo] = useState<User | null>(null);

    useEffect(() => {
        const fetchThisUser = async () => {
            const user = await getCurrentUserInfo();
            if (user) setThisUserInfo(user);
        };
    
        fetchThisUser();

        
        if (isLoggedIn) {
            fetchThisUser();
        }
    }, [isLoggedIn])

  return (
    <header>
        <Link to="/">Home</Link>
      {isLoggedIn? 
      <>
        <span>Welcome <b>{thisUserInfo?.username}</b></span>
        <button onClick={logout}>logout</button>
      </>: 
      
      <>
        <Link to="/signin">sign in</Link>
        <Link to="/signup">sign up</Link>
      </>}  
    </header>
  )
}

export default Header