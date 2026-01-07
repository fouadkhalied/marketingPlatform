"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
describe('Logger Integration Tests', () => {
    let logger;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Import the actual logger implementation
        const { createLogger } = yield Promise.resolve().then(() => __importStar(require('../../src/infrastructure/shared/common/logging')));
        logger = createLogger('test');
    }));
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
                constructor(logger) {
                    this.logger = logger;
                }
                performAction() {
                    this.logger.info('Action performed', { service: 'TestService' });
                    return 'success';
                }
                handleError(error) {
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
                constructor(logger) {
                    this.logger = logger;
                }
                handleRequest(userId) {
                    this.logger.info('Request received', { userId, controller: 'TestController' });
                    return { status: 'success', userId };
                }
                handleError(error, requestId) {
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
