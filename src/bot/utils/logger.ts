export class Logger {
  private static formatTime(): string {
    return new Date().toLocaleTimeString('vi-VN', { hour12: false });
  }

  public static info(message: string, ...args: any[]): void {
    console.log(`\x1b[36m[${this.formatTime()}] [INFO]\x1b[0m ${message}`, ...args);
  }

  public static success(message: string, ...args: any[]): void {
    console.log(`\x1b[32m[${this.formatTime()}] [SUCCESS]\x1b[0m ${message}`, ...args);
  }

  public static warn(message: string, ...args: any[]): void {
    console.warn(`\x1b[33m[${this.formatTime()}] [WARN]\x1b[0m ${message}`, ...args);
  }

  public static error(message: string, ...args: any[]): void {
    console.error(`\x1b[31m[${this.formatTime()}] [ERROR]\x1b[0m ${message}`, ...args);
  }

  public static command(data: {
    user: string;
    userId: string;
    command: string;
    guild?: string | null;
    status: 'SUCCESS' | 'FAILED' | 'DENIED';
    details?: string;
  }): void {
    const statusColor = 
      data.status === 'SUCCESS' ? '\x1b[32mSUCCESS\x1b[0m' :
      data.status === 'DENIED' ? '\x1b[33mDENIED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';

    console.log(
      `\x1b[35m[COMMAND]\x1b[0m [${statusColor}] /${data.command} | User: ${data.user} (${data.userId}) | Guild: ${data.guild || 'DM'}` +
      (data.details ? ` | Note: ${data.details}` : '')
    );
  }
}
