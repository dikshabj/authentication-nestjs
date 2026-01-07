import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { Tokens } from './types/tokens.type';
import { AtGuard } from 'src/common/guards/at.guard';
import { RtGuard } from 'src/common/guards/rt.guard';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/schemas/user.schema';
import { AuthResponse } from './types/auth-response.type';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: AuthDto): Promise<AuthResponse> {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: AuthDto,
 @Res({passthrough : true})response : Response) {
    const result = await this.authService.signin(dto);

    //set cookies
    this.setTokenCookies(response, result.tokens);

    return{
      message: 'Login successful',
      user : result.user
    }
  }

  //  Protected by AtGuard (Global or Local)
  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUserId() userId: string,
@Res({passthrough: true}) response : Response) {
    await this.authService.logout(userId);

    this.clearTokenCookies(response);

    return {message : 'Logged out!'}
  }

  //  Protected by RtGuard (Use Refresh Token in Header)
  @Public() // RT Guard handles security, so we can mark Public to bypass Global AtGuard if set
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  //  Protected by AtGuard
  @UseGuards(AtGuard)
  @Get('profile')
  getProfile(@GetCurrentUserId() userId: string) {
    return { message: 'Profile accessed', userId };
  }


  @UseGuards(AtGuard, RolesGuard) // 1. Apply AtGuard (for login) AND RolesGuard (for role check)
  @Roles(UserRole.ADMIN) // 2. Specify that only 'ADMIN' can access this
  @Get('admin')
  getAdminData() {
    return { message: 'You are an admin!' };
  }

  //helper functions

  private setTokenCookies(response: Response, tokens: any) {
    response.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false, // Prod mein true
      sameSite: 'lax',
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  private clearTokenCookies(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

}