import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export class AuthService {
  async registerUser(email, password, name) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name 
      },
    });

    const token = this.generateToken(user);

    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      }, 
      token 
    };
  }

  async loginUser(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = this.generateToken(user);
    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      }, 
      token 
    };
  }

  generateToken(user) {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      secret,
      { expiresIn: '7d' }
    );
  }
}