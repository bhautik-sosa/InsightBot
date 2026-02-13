export const logger = {
  info: (msg: string, data?: any) => {
    process.stdout.write(`[INFO] ${msg}\n`);
    if (data) process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  },
  warn: (msg: string, data?: any) => {
    process.stdout.write(`[WARN] ${msg}\n`);
    if (data) process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  },
  error: (msg: string, error?: any) => {
    process.stderr.write(`[ERROR] ${msg}\n`);
    if (error) process.stderr.write(String(error) + '\n');
  }
};