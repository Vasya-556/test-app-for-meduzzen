import React, {useState, useEffect, use} from 'react'
import { Link } from 'react-router-dom';

function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        token? setIsLoggedIn(true) : setIsLoggedIn(false)
    }, []);

    const handleLogout = async () => {
        try {
            localStorage.removeItem("token")
            window.location.reload();
        }
        catch (error) {
            console.error(error);
        }
    }

  return (
    <header>
        <Link to="/">Home</Link>
      {isLoggedIn? 
      <>
        <button onClick={handleLogout}>logout</button>
      </>: 
      
      <>
        <Link to="/signin">sign in</Link>
        <Link to="/signup">sign up</Link>
      </>}  
    </header>
  )
}

export default Header