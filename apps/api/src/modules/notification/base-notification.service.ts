import { Logger } from '@nestjs/common';
import { INotificationTransporter } from './notification.interface';

/**
 * Base class for notification services with provider fallback, retry logic, and error handling
 */
export abstract class BaseNotificationService<TPayload>
  implements INotificationTransporter<TPayload>
{
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Abstract method that concrete implementations must provide
   */
  abstract send(payload: TPayload): Promise<void>;

  /**
   * Send notification with provider fallback mechanism
   */
  protected async sendWithProviderFallback(
    providers: INotificationTransporter<TPayload>[],
    sendFunction: (
      provider: INotificationTransporter<TPayload>,
    ) => Promise<void>,
    logContext: Record<string, any> = {},
  ): Promise<void> {
    const providerErrors: Error[] = [];

    if (!providers || providers.length === 0) {
      throw new Error('No providers available for notification delivery');
    }

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const providerName = this.getProviderName(provider);

      try {
        this.logger.log(
          `Sending notification to ${logContext.recipient} using ${providerName}`,
          {
            ...logContext,
            providerName,
            providerAttempt: i + 1,
            totalProviders: providers.length,
          },
        );
        await sendFunction(provider);
        this.logger.log(
          `${logContext.notificationType} sent successfully using ${providerName}`,
          {
            ...logContext,
            providerName,
            providerAttempt: i + 1,
            totalProviders: providers.length,
          },
        );
        return;
      } catch (error) {
        const providerError = new Error(
          `Provider ${providerName} failed: ${error.message}`,
        );
        providerErrors.push(providerError);

        this.logger.warn(
          `${logContext.notificationType} failed with provider ${providerName}`,
          {
            ...logContext,
            providerName,
            providerAttempt: i + 1,
            totalProviders: providers.length,
            error: error.message,
            errorStack: error.stack,
          },
        );
      }
    }

    // All providers failed
    const deliveryError = new Error(
      `All ${providers.length} providers failed for ${logContext.notificationType}`,
    );

    this.logger.error(
      `${logContext.notificationType} delivery failed completely`,
      deliveryError.stack,
      {
        ...logContext,
        providersAttempted: providers.length,
        providerErrors: providerErrors.map((e) => ({
          error: e.message,
        })),
      },
    );

    throw deliveryError;
  }

  /**
   * Get provider name for logging
   */
  private getProviderName<TProvider>(provider: TProvider): string {
    if (provider && typeof provider === 'object' && 'constructor' in provider) {
      return (provider as any).constructor.name;
    }
    return 'UnknownProvider';
  }
}
