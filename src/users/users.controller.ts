import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    const entity = await this.usersService.findByIdOrFail(user.sub);
    return UserResponseDto.fromEntity(entity);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(UserResponseDto.fromEntity);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateByAdmin(id, dto, currentUser.sub);
    return UserResponseDto.fromEntity(user);
  }
}