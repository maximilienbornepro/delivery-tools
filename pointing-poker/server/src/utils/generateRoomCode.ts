import { customAlphabet } from 'nanoid';

// Exclude confusing characters: I, O, 0, 1, l
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = customAlphabet(alphabet, 6);

export const generateRoomCode = (): string => generateCode();
