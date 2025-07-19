import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createPostDto: CreatePostDto) {
    // 檢查 userId 是否存在對應的使用者
    const user = await this.userRepository.findOne({
      where: { id: createPostDto.userId },
    });
    if (!user) {
      throw new Error(`User with id ${createPostDto.userId} not found`);
    }
    const newPost = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      user,
    });
    this.postRepository.save(newPost);
    return {
      status: '200',
      message: 'Created new post succeed',
    };
  }

  async findPosts(userId): Promise<{
    posts: Post[];
    user: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['posts'],
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    return {
      posts: user.posts,
      user: user.name,
    };
  }

  async update(postId: string, updatePostDto: UpdatePostDto) {
    const post = await this.postRepository.findOneBy({ id: postId });

    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }
    this.postRepository.update(postId, updatePostDto);
    return {
      status: '200',
      message: 'Updated post succeed',
      data: {
        title: updatePostDto.title,
        content: updatePostDto.content,
      },
    };
  }

  remove(postId: string) {
    const post = this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }
    this.postRepository.delete(postId);
    return 'Delete post succeed';
  }
}
