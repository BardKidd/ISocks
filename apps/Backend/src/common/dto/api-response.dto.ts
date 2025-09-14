export class ApiResponseDto<T = any> {
  status: number;
  message: string[];
  data: T | null;

  constructor(
    status: number,
    message: string | string[],
    data: T | null = null,
  ) {
    this.status = status;
    this.message = Array.isArray(message) ? message : [message];
    this.data = data;
  }

  static success<T>(
    data: T,
    message: string | string[] = ['操作成功'],
  ): ApiResponseDto<T> {
    return new ApiResponseDto(200, message, data);
  }

  static error(
    status: number,
    message: string | string[],
  ): ApiResponseDto<null> {
    return new ApiResponseDto(status, message, null);
  }
}
