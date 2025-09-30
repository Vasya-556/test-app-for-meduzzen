import './App.css';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Header from './components/Header';
import { Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import Home from './components/Home';

function App() {
  return (
    <div>
      <Header/>
      <Routes>
        <Route path="/chat/:id" element={<Chat/>}/>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Home/>}/>
      </Routes>
    </div>
  );
}

export default App;
