'use server';

import type { CreateUserParams } from '@/types';
import { AppwriteException, ID, Query } from 'node-appwrite';
import { users } from '@/lib/appwrite.config';
import { parseStringify } from '../utils';

const parseUser = (user: CreateUserParams & { $id: string }) => ({
  $id: user.$id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

/**
 * Creates a new user in the Appwrite database.
 * If a user with the same email already exists, it retrieves and returns that user instead.
 *
 * @param user - An object containing the name, email, and phone number of the user to be created.
 * @returns - A promise that resolves to the created or existing user object, or null if no user is found.
 * @throws - Throws an error if there is an issue with the database operation, other than a conflict (409) or not found (404) error.
 */
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

/**
 * Retrieves a user from the Appwrite database by their unique ID.
 *
 * @param userId - The unique ID of the user to be retrieved.
 * @returns - A promise that resolves to the user object if found, or null if no user is found with the given ID.
 * @throws - Throws an error if there is an issue with the database operation, other than a not found (404) error.
 */
export const getUserById = async (userId: string) => {
  try {
    const user = await users.get({ userId: userId });
    return parseStringify(user);
  } catch (error: unknown) {
    console.log('Error fetching user by ID:', error);
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    throw error;
  }
};
