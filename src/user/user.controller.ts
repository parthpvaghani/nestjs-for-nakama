import { Get, Post, Body, Put, Delete, Param, Controller, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UserData, UserRO } from './user.interface';
import { CreateUserDto, UpdateUserDto, LoginUserDto } from './dto';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { User } from './user.decorator';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import {
  ApiBearerAuth, ApiTags
} from '@nestjs/swagger';
import {HttpService} from '@nestjs/axios'
import {map} from 'rxjs/operators'
@ApiBearerAuth()
@ApiTags('user')
@Controller()
export class UserController {

  constructor(private readonly userService: UserService,private readonly httpService:HttpService) {}

  @Get('user')
  async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  @Put('user')
  async update(@User('id') userId: number, @Body('user') userData: UpdateUserDto) {
    return await this.userService.update(userId, userData);
  }

  @UsePipes(new ValidationPipe())
  @Post('users')
  async create(@Body('user') userData: CreateUserDto) {
    return this.userService.create(userData)
  }

  @UsePipes(new ValidationPipe())
  @Post('users/addFriend')
  async addUser(@Body('user') userData) {
    return this.userService.create(userData)
  }

  @Delete('users/:slug')
  async delete(@Param() params) {
    return await this.userService.delete(params.slug);
  }

  @UsePipes(new ValidationPipe())
  @Post('users/login')
  async login(@Body('user') loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    const errors = {User: ' not found'};
    if (!_user) throw new HttpException({errors}, 401);
    const token = await this.userService.generateJWT(_user);
    const {email, username, bio, image} = _user;
    const password = loginUserDto.password
    const url = `http://127.0.0.1:7350/v2/account/authenticate/email`;
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },auth: {
        username: 'defaultkey',
        password: ''
      }
    };
    const response = await this.httpService.post(url, {
      email,password
    }, options).toPromise()
    const data = response.data;
    const nToken = data.token;
    const nRefToken = data.refresh_token
    const user = {email, token, username, bio, image,nToken,nRefToken};
    return {user}
  }
  @Get('users/all')
  async find() {
    return await this.userService.findAll();
  }

}
