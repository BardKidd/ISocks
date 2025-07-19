import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );
    createUserDto.password = hashedPassword;
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save({
      ...newUser,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  // 一般情況不回傳 password。
  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  // 專門用於登入驗證使用來比較密碼
  async findUserForAuth(email: string): Promise<User | undefined> {
    // createQueryBuilder 可以使用鏈式(chaining) 來處理複雜的 SQL 查詢。特別是當一般的 find, findOne, save 無法完成需求時。
    return (
      this.userRepository
        .createQueryBuilder('user') // 搜尋 user 資料表
        .where('user.email = :email', { email }) // :email 是一個 parameter placeholder，用來安全的將物件內的 email 拼接到搜尋條件上。
        // 為什麼要這麼作？因為你其實是在處理 SQL 指令的 SELECT * FROM user WHERE email = _____
        // 而假如 user 輸入的是一段惡意的程式碼，例如 DROP 或其他導致 SQL 指令遭竄改，這就是 SQL 的注入攻擊。
        // 而多了 :email 的步驟則會仔細檢查傳入的內容是否為字串，SELECT * FROM user WHERE email = :email
        // 等確定 parameter placeholder 檢查完沒問題他才會將使用者傳入的內容放到 :email 的位置。
        .addSelect('user.password')
        .getOne()
    );
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
