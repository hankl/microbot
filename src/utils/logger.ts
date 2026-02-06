export class Logger {
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [microbot] ${message}`;
  }

  info(message: string, ...args: any[]) {
    console.log(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  debug(message: string, ...args: any[]) {
    console.debug(this.formatMessage('DEBUG', message), ...args);
  }

  trace(message: string, ...args: any[]) {
    console.trace(this.formatMessage('TRACE', message), ...args);
  }
}