"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.getUserById = getUserById;
exports.createUser = createUser;
const user_1 = require("@shared/schema/user");
// Mock user database - in a real app, this would be a database
const mockUsers = [
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
const mockPasswords = {
    'admin@example.com': 'admin123',
    'user@example.com': 'user123'
};
/**
 * Authenticate a user with email and password
 */
async function authenticateUser(email, password) {
    try {
        // Validate input using Zod schema
        const validatedInput = user_1.userLoginSchema.parse({ email, password });
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
    }
    catch (error) {
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
async function getUserById(id) {
    const user = mockUsers.find(u => u.id === id);
    if (!user)
        return null;
    // Return user data
    return user;
}
/**
 * Create a new user
 */
async function createUser(userData) {
    // In a real app, you would hash the password here
    const newUser = {
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
