import React, {useState} from 'react'
import BaseUrl from '../utils/BaseUrl';
import { validateEmail, validatePasswordLength } from '../utils/validationHelper';
import { useNavigate } from 'react-router-dom';

interface UserData {
  email: string;
  password: string;
}

function SignIn() {
  const [userData, setUserData] = useState<UserData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ 
    emailError?: string; 
    passwordError?: string
  }>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
    setErrors({ ...errors, [`${e.target.name}Error`]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(userData.email);
    const passwordError = validatePasswordLength(userData.password);

    const newErrors = {
      emailError: emailError || undefined,
      passwordError: passwordError || undefined,
    };

    setErrors(newErrors);

    if (emailError || passwordError) return;

    try {
      const response = await fetch(`${BaseUrl}signin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      // console.log('Signin response:', data);
      localStorage.setItem("token", data.access_token);
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={userData.email}
          onChange={handleChange}
        />
        {errors.emailError && <span>{errors.emailError}</span>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={userData.password}
          onChange={handleChange}
        />
        {errors.passwordError && <span>{errors.passwordError}</span>}
        <button type="submit">Sign In</button>
      </form>
    </div>
  )
}

export default SignIn