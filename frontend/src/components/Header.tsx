import React from 'react'
import { Link } from 'react-router-dom';
import { useIsLoggedIn} from '../isLoggedIn'

function Header() {
    const { isLoggedIn, logout } = useIsLoggedIn();

  return (
    <header>
        <Link to="/">Home</Link>
      {isLoggedIn? 
      <>
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