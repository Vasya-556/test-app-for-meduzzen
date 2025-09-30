import './App.css';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Header from './components/Header';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div>
      <Header/>
      {/* <SignUp/>
      <SignIn/> */}
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </div>
  );
}

export default App;
