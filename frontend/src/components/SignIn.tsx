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
    <div  className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md mt-8">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={userData.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        {errors.emailError && <span className="text-red-500 text-sm">{errors.emailError}</span>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={userData.password}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        {errors.passwordError && <span className="text-red-500 text-sm">{errors.passwordError}</span>}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign In</button>
      </form>
    </div>
  )
}

export default SignIn