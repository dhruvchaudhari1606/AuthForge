import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '@database/entities/user.entity';
import { Role } from '@database/entities/role.entity';
import { QueryDto } from '@common/dto/query.dto';
import {
  buildPagination,
  PaginationResult,
} from '@common/utils/pagination.util';
import { MailService } from '@modules/mail/mail.service';
import { MailTemplate } from '@common/constants/mail.constants';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { UserStatus } from '@common/constants/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findExistUserById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async createUser(data: RegisterDto): Promise<User> {
    const role = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    if (!role) {
      throw new InternalServerErrorException(
        'Default user role is not configured. Please run database seeders.',
      );
    }

    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
      10,
    );
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = this.userRepository.create({
      name: data.name,
      first_name: data.firstName || data.name.split(' ')[0],
      last_name:
        data.lastName || data.name.split(' ').slice(1).join(' ') || undefined,
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      roles: [role],
      status: UserStatus.ACTIVE,
      language: data.language,
    });

    const userDetails = await this.userRepository.save(user);

    await this.mailService.send({
      to: data.email,
      subjectKey: 'mail.welcome_subject',
      template: MailTemplate.WELCOME,
      context: { name: data.name },
      language: data.language,
    });

    return userDetails;
  }

  async findAll(query: QueryDto): Promise<PaginationResult<User>> {
    const [users, count] = await this.userRepository.findAndCount({
      skip: (query.page! - 1) * query.limit!,
      take: query.limit,
      order: { [query.sortBy!]: query.order },
      relations: ['roles'],
    });
    return buildPagination(users, count, query.page!, query.limit!);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login_at: new Date(),
    });
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'token_version', 1);
  }
}
