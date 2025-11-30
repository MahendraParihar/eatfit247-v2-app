import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private db: SequelizeHealthIndicator,
  ) {
  }

  @Get()
  @HealthCheck()
  check() {
    // RSS is the Resident Set Size and is used to show how much memory is allocated to that process and is in RAM. It does not include memory that is swapped out. It does include memory from shared libraries as long as the pages from those libraries are actually in memory. It does include all stack and heap memory.
    const checks = [
      () => this.db.pingCheck('database', { timeout: 5000 }),
      () => this.disk.checkStorage('storage', { path: '/', threshold: 50 * 1024 * 1024 * 1024 }),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ];
    return this.health.check(checks);
  }
}

