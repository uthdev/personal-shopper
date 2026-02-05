import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import logger from './logger';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

interface HttpClientConfig {
  timeout: number;
  retryConfig?: Partial<RetryConfig>;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: HttpClientConfig) {
    this.retryConfig = {
      maxRetries: config.retryConfig?.maxRetries || 3,
      retryDelay: config.retryConfig?.retryDelay || 1000,
      backoffMultiplier: config.retryConfig?.backoffMultiplier || 2,
    };

    this.axiosInstance = axios.create({
      timeout: config.timeout,
    });
  }

  /**
   * Perform HTTP GET request with retry logic
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() =>
      this.axiosInstance.get(url, config)
    );
  }

  /**
   * Perform HTTP POST request with retry logic
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.requestWithRetry<T>(() =>
      this.axiosInstance.post(url, data, config)
    );
  }

  /**
   * Perform HTTP PUT request with retry logic
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.requestWithRetry<T>(() =>
      this.axiosInstance.put(url, data, config)
    );
  }

  /**
   * Perform HTTP PATCH request with retry logic
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.requestWithRetry<T>(() =>
      this.axiosInstance.patch(url, data, config)
    );
  }

  /**
   * Perform HTTP DELETE request with retry logic
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(() =>
      this.axiosInstance.delete(url, config)
    );
  }

  /**
   * Request with retry logic and exponential backoff
   */
  private async requestWithRetry<T>(
    request: () => Promise<any>,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const isRetryableError = this.isRetryableError(axiosError);
      const shouldRetry =
        isRetryableError && attempt < this.retryConfig.maxRetries;

      if (shouldRetry) {
        const delay =
          this.retryConfig.retryDelay *
          Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

        logger.warn(
          `Request failed (attempt ${attempt}/${this.retryConfig.maxRetries}). Retrying in ${delay}ms...`,
          {
            url: axiosError.config?.url,
            status: axiosError.response?.status,
            error: axiosError.message,
          }
        );

        await this.delay(delay);
        return this.requestWithRetry<T>(request, attempt + 1);
      }

      // Final error handling
      logger.error('Request failed after retries', {
        url: axiosError.config?.url,
        status: axiosError.response?.status,
        attempts: attempt,
        error: axiosError.message,
      });

      throw axiosError;
    }
  }

  /**
   * Determine if error is retryable (network errors, timeouts, 5xx)
   */
  private isRetryableError(error: AxiosError): boolean {
    // Network errors
    if (!error.response) {
      return true;
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return true;
    }

    // 5xx server errors are retryable
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
