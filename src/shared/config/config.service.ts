import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  private currentEnv: string = process.env.NODE_ENV || 'development';

  constructor() {
    if (this.currentEnv === 'development') {
      this.logger.log('Project started in development mode');
      const result = dotenv.config({ path: '.env' });
      if (result.error) {
        throw result.error;
      }
    }
  }

  get(key: string): string {
    return process.env[key];
  }

  get port(): string | number {
    return process.env.PORT || 3000;
  }

  get isDevelopment(): boolean {
    return this.currentEnv === 'development';
  }

  get databaseUri(): string {
    return process.env.DATABASE_URL;
  }
}
