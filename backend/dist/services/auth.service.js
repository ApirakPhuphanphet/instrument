import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/password.js';
export class AuthServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'AuthServiceError';
        this.statusCode = statusCode;
    }
}
export class AuthService {
    /**
     * Verify email and password credentials.
     */
    async login(input) {
        const { email, password } = input;
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                },
                deletedAt: null
            }
        });
        if (!user || !user.passwordHash) {
            throw new AuthServiceError('Invalid email or password', 401);
        }
        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            throw new AuthServiceError('Invalid email or password', 401);
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            rfid: user.rfid
        };
    }
    /**
     * Change user password.
     */
    async changePassword(userId, input) {
        const { currentPassword, newPassword } = input;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.deletedAt !== null) {
            throw new AuthServiceError('User not found', 404);
        }
        if (user.passwordHash) {
            const isMatch = await comparePassword(currentPassword, user.passwordHash);
            if (!isMatch) {
                throw new AuthServiceError('Current password is incorrect', 400);
            }
        }
        const newHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                mustChangePassword: false
            }
        });
    }
    /**
     * Get user profile by ID.
     */
    async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.deletedAt !== null) {
            throw new AuthServiceError('User not found or deactivated', 404);
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            rfid: user.rfid
        };
    }
}
export const authService = new AuthService();
