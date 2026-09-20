import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { Role } from '@database/entities/role.entity';
import { UsersController } from './users.controller';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), MailModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
