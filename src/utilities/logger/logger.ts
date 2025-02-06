import chalk from "chalk";

export class Logger {
  static async log<T>(msg: string, cb: () => T): Promise<T> {
    const spin = "⢎⡰⢎⡡⢎⡑⢎⠱⠎⡱⢊⡱⢌⡱⢆⡱";
    const len = spin.length;
    const period = 50;

    let interval: NodeJS.Timeout;
    let pos = 0;
    let time = Date.now();

    const msgLen = 50;

    let padMsg = msg.padEnd(msgLen, " ");

    if (padMsg.length > msgLen) {
      padMsg = padMsg.slice(0, msgLen - 3) + "...";
    }

    progress();
    const result = await cb();
    finish();

    return result;

    function progress() {
      if (interval) {
        clearInterval(interval);
      }

      interval = setInterval(() => {
        process.stdout.write(`\r${chalk.yellow(`${spin[pos]}${spin[pos + 1]}`)} ${padMsg} `);
        pos = (pos + 2) % len;
      }, period);
    }

    function finish() {
      if (interval) {
        clearInterval(interval);
      }

      const diff = Date.now() - time;
      const timeStr = `${diff}ms`.padStart(6, " ");

      process.stdout.write(`\r${chalk.green(` \u2713`)} ${padMsg} ${timeStr}\n`);
    }
  }
}
