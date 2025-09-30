import React, { useState } from 'react';
import BaseUrl from '../utils/BaseUrl';
import { validateEmail, validatePasswordLength, validatePasswordsMatch, validateUsernameLength } from '../utils/validationHelper';
import { useNavigate } from 'react-router-dom';

interface UserData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignUp() {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    usernameError?: string;
    emailError?: string;
    passwordError?: string;
    confirmPasswordError?: string;
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

    const usernameError = validateUsernameLength(userData.username) || undefined;
    const emailError = validateEmail(userData.email) || undefined;
    const passwordError = validatePasswordLength(userData.password) || undefined;
    const confirmPasswordError = validatePasswordsMatch(userData.password, userData.confirmPassword) || undefined;

    const newErrors = { usernameError, emailError, passwordError, confirmPasswordError };
    setErrors(newErrors);

    if (usernameError || emailError || passwordError || confirmPasswordError) return;

    try {
      const response = await fetch(`${BaseUrl}signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
        }),
      });

      if (response.ok) {
        navigate('/signin');
      } else {
        const data = await response.json();
        console.error('Signup error:', data);
      }
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md mt-8">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="username"
          placeholder="Username"
          required
          value={userData.username}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        {errors.usernameError && <span className="text-red-500 text-sm">{errors.usernameError}</span>}
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
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          value={userData.confirmPassword}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        {errors.confirmPasswordError && <span className="text-red-500 text-sm">{errors.confirmPasswordError}</span>}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;