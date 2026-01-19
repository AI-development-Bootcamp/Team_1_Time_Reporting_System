import bcrypt from 'bcrypt';

export class Bcrypt {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }
}
