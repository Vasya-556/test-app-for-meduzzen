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
    <header className="flex justify-between items-center p-4 bg-gray-100 shadow">
        <Link to="/" className="font-bold text-lg">Home</Link>
      {isLoggedIn? 
      <div className="flex items-center gap-4">
        <span className="text-gray-700">
          Welcome <b className="font-semibold text-black-600">{thisUserInfo?.username}</b>
        </span>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">logout</button>
      </div>: 
      
      <div className="flex gap-4">
        <Link to="/signin" className="text-blue-500 hover:underline">Sign in</Link>
        <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
      </div>}  
    </header>
  )
}

export default Header