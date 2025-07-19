import { User, CreateUser, UpdateUser } from '@workspace/shared';
import crypto from 'crypto';

// In-memory database for demo purposes
// In production, you'd use a real database
const users = new Map<string, User>();

export class UserService {
  async findAll(limit: number, offset: number) {
    const allUsers = Array.from(users.values());
    const items = allUsers.slice(offset, offset + limit);
    
    return {
      items,
      total: allUsers.length,
      limit,
      offset,
    };
  }

  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  async create(data: CreateUser): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUser): Promise<User | null> {
    const user = users.get(id);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return users.delete(id);
  }
}

export const userService = new UserService();