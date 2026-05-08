import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'GamerLand API',
      status: 'ok',
      docs: '/docs',
      version: '1.0.0',
    };
  }
}
