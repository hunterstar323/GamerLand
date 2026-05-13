import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(user: Partial<User>): Promise<User> {
    const entity = this.usersRepository.create(user);
    return this.usersRepository.save(entity);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateByAdmin(
    id: number,
    dto: AdminUpdateUserDto,
    currentAdminId: number,
  ): Promise<User> {
    const user = await this.findByIdOrFail(id);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.role !== undefined) {
      if (user.id === currentAdminId) {
        throw new ForbiddenException(
          'No puedes modificar tu propio rol de administrador.',
        );
      }

      user.role = dto.role;
    }

    return this.usersRepository.save(user);
  }
}