import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { ConfigurationService } from './shared/config/config.service';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  static port: number | string;
  static isDev: boolean;
  constructor(private readonly _configurationService: ConfigurationService) {
    AppModule.port = _configurationService.port;
    AppModule.isDev = _configurationService.isDevelopment;
  }
}
