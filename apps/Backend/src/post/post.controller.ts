import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.postService.findPosts(userId);
  }

  @Patch(':postId')
  update(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(postId, updatePostDto);
  }

  @Delete(':postId')
  remove(@Param('postId') postId: string) {
    return this.postService.remove(postId);
  }
}
