import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecipesModule } from './recipes/recipes.module';
import { PrismaModule } from './prisma/prisma.module';
import { BoardsModule } from './boards/boards.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RecipesModule,
    BoardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
