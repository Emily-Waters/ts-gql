export class StringUtils {
  static indent(str: string, depth: number = 1) {
    if (depth <= 0) {
      return str;
    }
    return `${"  ".repeat(depth)}${str}`;
  }

  static capitalize(str: string) {
    return `${str.charAt(0).toUpperCase()}${str.substring(1)}`;
  }

  static stripNonAlpha(str: string) {
    return str.replace(/\W/gi, "");
  }
}
