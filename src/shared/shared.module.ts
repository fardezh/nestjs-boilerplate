import { Global, Module } from '@nestjs/common';
import { ConfigurationService } from './config/config.service';
import { PrismaService } from './prisma/prisma.service';

// this module is global so you can use
// it's services without importing it

@Global()
@Module({
  providers: [ConfigurationService, PrismaService],
  exports: [ConfigurationService, PrismaService],
})
export class SharedModule {}
