import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { AuthDto } from './dto/auth.dto';
import { Tokens } from './types/tokens.type';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // SIGNUP
  async signup(dto: AuthDto): Promise<Tokens> {
    const hash = await bcrypt.hash(dto.password, 10);
    
    // Default role 'user' set kar rahe hain
    const newUser = new this.userModel({
      email: dto.email,
      hash,
      role: 'user', 
    });

    try {
      await newUser.save();
      // 👇 Yahan 'user' pass kar rahe hain role ke liye
      return await this.getTokens(newUser._id, newUser.email, newUser.role);
    } catch (error) {
      if (error.code === 11000) throw new ForbiddenException('Email already exists');
      throw error;
    }
  }

  // SIGNIN
  async signin(dto: AuthDto): Promise<Tokens> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await bcrypt.compare(dto.password, user.hash);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    // 👇 (user as any).role use kiya taaki TypeScript error na de
    return await this.getTokens(user._id, user.email, (user as any).role);
  }

  // LOGOUT
  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { hashedRt: null });
  }

  // REFRESH TOKENS
  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    // 👇 Yahan bhi role pass kiya
    const tokens = await this.getTokens(user._id, user.email, (user as any).role);
    await this.updateRtHash(user._id, tokens.refresh_token);
    return tokens;
  }

  // --- HELPERS ---

  async updateRtHash(userId: any, rt: string): Promise<void> {
    const hash = await bcrypt.hash(rt, 10);
    await this.userModel.findByIdAndUpdate(userId, { hashedRt: hash });
  }

  // 👇 Updated: Added 'role' parameter here
  async getTokens(userId: any, email: string, role: string): Promise<Tokens> {
    const userIdString = userId.toString(); 

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { 
          sub: userIdString, 
          email, 
          role: role || 'user' // Payload mein Role add kar diya
        },
        {
          secret: 'AT_SECRET', 
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { 
          sub: userIdString, 
          email,
          role: role || 'user'
        },
        {
          secret: 'RT_SECRET', 
          expiresIn: '7d',
        },
      ),
    ]);

    return { access_token: at, refresh_token: rt };
  }
}