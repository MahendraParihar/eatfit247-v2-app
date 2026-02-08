import { Module, Global, OnModuleInit } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Registry } from 'prom-client';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'eatfit247_',
        },
      },
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule implements OnModuleInit {
  private readonly registry: Registry;

  // HTTP request metrics
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestTotal: Counter<string>;
  public readonly httpErrorsTotal: Counter<string>;

  // Payment metrics
  public readonly paymentTotal: Counter<string>;
  public readonly paymentAmount: Histogram<string>;
  public readonly webhookTotal: Counter<string>;
  public readonly webhookErrors: Counter<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'eatfit247' });

    // HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: 'eatfit247_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'eatfit247_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: 'eatfit247_http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    // Payment metrics
    this.paymentTotal = new Counter({
      name: 'eatfit247_payments_total',
      help: 'Total number of payments',
      labelNames: ['status', 'gateway', 'type'],
      registers: [this.registry],
    });

    this.paymentAmount = new Histogram({
      name: 'eatfit247_payment_amount',
      help: 'Payment amounts',
      labelNames: ['gateway', 'currency'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });

    this.webhookTotal = new Counter({
      name: 'eatfit247_webhooks_total',
      help: 'Total number of webhooks received',
      labelNames: ['event', 'status'],
      registers: [this.registry],
    });

    this.webhookErrors = new Counter({
      name: 'eatfit247_webhook_errors_total',
      help: 'Total number of webhook errors',
      labelNames: ['event', 'error_type'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Metrics are automatically collected by PrometheusModule
  }

  getRegistry(): Registry {
    return this.registry;
  }
}

