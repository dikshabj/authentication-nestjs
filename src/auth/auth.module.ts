import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule, // 👈 Ensures strategies are picked up
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AtStrategy, // 👈 Must be here
    RtStrategy, // 👈 Must be here
  ],
})
export class AuthModule {}