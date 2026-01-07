import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from 'src/schemas/user.schema';
import { AuthDto } from './dto/auth.dto';
import { Tokens } from './types/tokens.type';
import * as bcrypt from 'bcrypt';
import { AuthResponse } from './types/auth-response.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // SIGNUP
  async signup(dto: AuthDto): Promise<AuthResponse> {
  const hash = await bcrypt.hash(dto.password, 10);

  let assginedRole = UserRole.USER;
  if(dto.adminSecret === process.env.MY_ADMIN_SECRET){
    assginedRole = UserRole.ADMIN;
  }
  
  const newUser = new this.userModel({
    email: dto.email,
    hash,
    role: assginedRole, 
  });

  try {
    await newUser.save();
    const tokens = await this.getTokens(newUser._id, newUser.email, newUser.role);
    
    //   TO SAVE THE HASH
    await this.updateRtHash(newUser._id, tokens.refresh_token);
    
    return {
      message :'SignUp Successful!',
      user : {
        id: newUser._id.toString(),
        email: newUser.email,
        role : newUser.role,
      },
      tokens,
    };
  } catch (error) {
    if (error.code === 11000) throw new ForbiddenException('Email already exists');
    throw error;
  }
}

  // SIGNIN
 async signin(dto: AuthDto): Promise<AuthResponse> {
  const user = await this.userModel.findOne({ email: dto.email });
  if (!user) throw new ForbiddenException('Access Denied');

  const passwordMatches = await bcrypt.compare(dto.password, user.hash);
  if (!passwordMatches) throw new ForbiddenException('Access Denied');

  const tokens = await this.getTokens(user._id, user.email, (user as any).role);

  //  ADD THIS LINE TO SAVE THE HASH
  await this.updateRtHash(user._id, tokens.refresh_token);

  return {
    message : 'Login Succesful!',
    user : {
      id: user._id.toString(),
      email: user.email,
      role:(user as any).role,
    },
    tokens,
  };
}
  // LOGOUT
  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { hashedRt: null });
  }

  // REFRESH TOKENS
  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user = await this.userModel.findById(userId);
    console.log('UserID from Token:', userId);
    console.log('Refresh Token received:', rt);
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    //  Yahan bhi role pass kiya
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