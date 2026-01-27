import { userLoginSchema, User } from '@shared/schema/user';

// Mock user database - in a real app, this would be a database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'STAFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock password storage - in a real app, passwords would be hashed
const mockPasswords: Record<string, string> = {
  'admin@example.com': 'admin123',
  'user@example.com': 'user123'
};

export interface AuthResult {
  success: boolean;
  user?: User;
  message?: string;
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate input using Zod schema
    const validatedInput = userLoginSchema.parse({ email, password });

    // Find user by email
    const user = mockUsers.find(u => u.email === validatedInput.email);

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Check password (in a real app, this would compare hashed passwords)
    if (mockPasswords[user.email] !== validatedInput.password) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Return user data
    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const user = mockUsers.find(u => u.id === id);
  if (!user) return null;

  // Return user data
  return user;
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
  // In a real app, you would hash the password here
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9), // Generate a simple ID
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockUsers.push(newUser);
  mockPasswords[newUser.email] = userData.password;

  // Return user
  return newUser;
}
