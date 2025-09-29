import React, {useState, useEffect, use} from 'react'

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
      {isLoggedIn? 
      <>
        <button onClick={handleLogout}>logout</button>
      </>: 
      
      <>
        <a>signIn</a>
        <a>signUp</a>
      </>}  
    </header>
  )
}

export default Header