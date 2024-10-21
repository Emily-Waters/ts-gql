import chalk from "chalk";

export class Logger {
  static async log<T>(msg: string, cb: () => T): Promise<T> {
    const spin = "⢎⡰⢎⡡⢎⡑⢎⠱⠎⡱⢊⡱⢌⡱⢆⡱";
    const len = spin.length;
    const period = 50;

    let interval: NodeJS.Timeout;
    let pos = 0;
    let time = Date.now();

    function progress() {
      if (interval) {
        clearInterval(interval);
      }

      interval = setInterval(() => {
        process.stdout.write(`\r${chalk.yellow(`${spin[pos]}${spin[pos + 1]}`)} ${msg} `);
        pos = (pos + 2) % len;
      }, period);
    }

    function finish() {
      if (interval) {
        clearInterval(interval);
      }

      process.stdout.write(`\r${chalk.green(` \u2713`)} ${msg} ${Date.now() - time}ms\n`);
    }

    progress();
    const result = await cb();
    finish();

    return result;
  }
}
