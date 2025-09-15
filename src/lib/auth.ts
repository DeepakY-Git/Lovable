import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'operator' | 'technician' | 'management';
  employee_id: string;
  full_name: string;
  is_verified: boolean;
}

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  email: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const validateEmployeeId = (employeeId: string): boolean => {
  // Basic validation for employee ID format (EMP followed by digits)
  return /^EMP\d{3,6}$/.test(employeeId);
};

export const validateEmail = (email: string): boolean => {
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};