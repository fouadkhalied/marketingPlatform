import { ILogger } from '../../src/infrastructure/shared/common/logging';

describe('Logger Integration Tests', () => {
  let logger: ILogger;

  beforeAll(async () => {
    // Import the actual logger implementation
    const { createLogger } = await import('../../src/infrastructure/shared/common/logging');
    logger = createLogger('test');
  });

  describe('ILogger Interface', () => {
    it('should implement all required methods', () => {
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('child');
    });

    it('should support method chaining', () => {
      const childLogger = logger.child({ context: 'test' });
      expect(childLogger).toHaveProperty('info');
      expect(childLogger).toHaveProperty('error');
    });
  });

  describe('Logger Functionality', () => {
    it('should accept info messages without throwing', () => {
      expect(() => {
        logger.info('Test info message');
      }).not.toThrow();
    });

    it('should accept error messages without throwing', () => {
      expect(() => {
        logger.error('Test error message');
      }).not.toThrow();
    });

    it('should accept warning messages without throwing', () => {
      expect(() => {
        logger.warn('Test warning message');
      }).not.toThrow();
    });

    it('should accept debug messages without throwing', () => {
      expect(() => {
        logger.debug('Test debug message');
      }).not.toThrow();
    });

    it('should accept messages with metadata', () => {
      expect(() => {
        logger.info('Test message with metadata', { userId: '123', action: 'test' });
      }).not.toThrow();
    });

    it('should accept error objects in metadata', () => {
      const testError = new Error('Test error');
      expect(() => {
        logger.error('Error occurred', { error: testError, userId: '123' });
      }).not.toThrow();
    });
  });

  describe('Service Integration', () => {
    it('should work with service constructors that accept ILogger', () => {
      class TestService {
        constructor(private logger: ILogger) {}

        performAction() {
          this.logger.info('Action performed', { service: 'TestService' });
          return 'success';
        }

        handleError(error: Error) {
          this.logger.error('Error in service', { error: error.message, service: 'TestService' });
          throw error;
        }
      }

      const service = new TestService(logger);

      expect(service.performAction()).toBe('success');

      expect(() => {
        service.handleError(new Error('Test error'));
      }).toThrow('Test error');
    });
  });

  describe('Controller Integration', () => {
    it('should work with controller constructors that accept ILogger', () => {
      class TestController {
        constructor(private logger: ILogger) {}

        handleRequest(userId: string) {
          this.logger.info('Request received', { userId, controller: 'TestController' });
          return { status: 'success', userId };
        }

        handleError(error: Error, requestId: string) {
          this.logger.error('Request failed', {
            error: error.message,
            requestId,
            controller: 'TestController'
          });
          return { status: 'error', message: error.message };
        }
      }

      const controller = new TestController(logger);

      const result = controller.handleRequest('user-123');
      expect(result).toEqual({ status: 'success', userId: 'user-123' });

      const errorResult = controller.handleError(new Error('Validation failed'), 'req-456');
      expect(errorResult.status).toBe('error');
    });
  });
});
