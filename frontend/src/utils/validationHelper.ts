export const validateEmail = (email: string): string | null => {
    const normalizedEmail = email.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(normalizedEmail) ? null : 'Invalid email format';
};

export const validatePasswordLength = (password: string, minLength = 8): string | null => {
    return password.length >= minLength ? null : `Password must be at least ${minLength} characters long`;
};

export const validatePasswordsMatch = (password: string, confirmPassword: string): string | null => {
    return password === confirmPassword ? null : 'Passwords do not match';
};

export const validateUsernameLength = (username: string, minLength = 5): string | null => {
    return username.length >= minLength ? null : `Username must be at least ${minLength} characters long`;
};