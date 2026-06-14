import {
  Client,
  Databases,
  Storage,
  Functions,
  Messaging,
  Users,
} from 'node-appwrite';

export const {
  APPWRITE_API_KEY: API_KEY,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: PROJECT_ID,
  APPWRITE_DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_BUCKET_ID,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
} = process.env;

const client = new Client();
client.setEndpoint(ENDPOINT!).setProject(PROJECT_ID!).setKey(API_KEY!);

export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const messaging = new Messaging(client);
export const users = new Users(client);
