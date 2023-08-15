import { Controller, Post, Body, BadRequestException, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

import { CreateTenantUserDto, CreateUserDto } from 'src/user/dto/create-user.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { UserService } from 'src/user/user.service';
import { CodeTips } from 'src/config/code';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { TenantService } from 'src/tenant/tenant.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('login')
  @Public()
  login(@Body() user: CreateUserDto) {
    return this.authService.login(user.username);
  }
  @Post('register/user')
  @Public()
  async register(@Body() userDto: CreateUserDto) {
    const usernameExists = await this.userService.findOneByUsername(userDto.username);
    if (usernameExists) throw new BadRequestException(CodeTips.c1000);
    const user = await this.userService.create(userDto);
    return this.authService.authenticate(user);
  }
  @Post('register/tenant')
  @Public()
  async registerTenant(@Body() userDto: CreateTenantUserDto) {
    const tenantExists = await this.tenantService.findOneByName(userDto.name);
    if (tenantExists) throw new BadRequestException(CodeTips.c1000);
    const tenant = await this.tenantService.create({ name: userDto.name, description: userDto.description });
    const user = await this.userService.create({
      username: userDto.username || userDto.name,
      password: userDto.password,
      tenantId: tenant.tenantId,
    });
    return this.authService.authenticate(user);
  }
  @UseGuards(RefreshTokenGuard)
  @Public()
  @Get('refresh')
  refreshToken(@Req() request) {
    const userId = request.user['sub'];
    const refreshToken = request.user['refreshToken'];
    return this.authService.refreshToken(userId, refreshToken);
  }
}
