'use server';

import type { CreateUserParams } from '@/types';
import { AppwriteException, ID, Query } from 'node-appwrite';
import { users } from '@/lib/appwrite.config';

const parseUser = (user: CreateUserParams & { $id: string }) => ({
  $id: user.$id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create({
      userId: ID.unique(),
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return parseUser(newUser);
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 409) {
      const existingUser = await users.list({
        queries: [Query.equal('email', user.email)],
      });

      return existingUser.users[0] ? parseUser(existingUser.users[0]) : null;
    }

    throw error;
  }
};
