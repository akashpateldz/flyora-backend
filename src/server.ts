import createApp from './app';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log('\n');
    console.log('  ✈️  ════════════════════════════════════════════');
    console.log('  ✈️  FLYORA API SERVER STARTED');
    console.log('  ✈️  ════════════════════════════════════════════');
    console.log(`  🌐  URL:         http://${env.host}:${env.port}`);
    console.log(`  🔧  Environment: ${env.nodeEnv}`);
    console.log(`  📦  Version:     ${env.apiVersion}`);
    console.log('  ✈️  ════════════════════════════════════════════');
    console.log('  📍  Endpoints:');
    console.log(`  →   GET  http://${env.host}:${env.port}/api/health`);
    console.log(`  →   GET  http://${env.host}:${env.port}/api/stats`);
    console.log(`  →   GET  http://${env.host}:${env.port}/api/routes`);
    console.log(`  →   GET  http://${env.host}:${env.port}/api/features`);
    console.log(`  →   POST http://${env.host}:${env.port}/api/waitlist`);
    console.log('  ✈️  ════════════════════════════════════════════\n');
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const gracefulShutdown = (signal: string): void => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log('[SHUTDOWN] Server closed. Process exiting.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('[SHUTDOWN] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('[FATAL] Uncaught Exception:', error);
    process.exit(1);
  });
};

startServer();
