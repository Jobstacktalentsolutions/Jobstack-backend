import { Injectable } from '@nestjs/common';

@Injectable()
export class BackgroundService {
  getHello(): string {
    return 'Hello World!';
  }
}
