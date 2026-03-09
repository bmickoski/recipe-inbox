import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { PushService } from './push.service';

@ApiTags('push')
@ApiBearerAuth()
@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @ApiOperation({ summary: 'Subscribe current device for push notifications' })
  @Post('subscribe')
  async subscribe(
    @Body() body: SubscribePushDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.pushService.subscribe(user.sub, body);
    return { ok: true };
  }
}
