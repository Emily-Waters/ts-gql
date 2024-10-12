export class StringUtils {
  static indent(str: string, depth: number = 1) {
    return `${"  ".repeat(depth)}${str}`;
  }

  static stripNonAlpha(str: string) {
    return str.replace(/\W/gi, "");
  }
}
