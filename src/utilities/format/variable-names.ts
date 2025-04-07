import emdash from "@emilywaters/emdash";

export class Format {
  static result(name: string, operation: string) {
    return `${emdash.string.capitalize(name)}${emdash.string.capitalize(operation)}Data`;
  }

  static input(name: string, operation: string) {
    return `${emdash.string.capitalize(name)}${emdash.string.capitalize(operation)}Variables`;
  }

  static document(name: string, operation: string) {
    return `${emdash.string.capitalize(name)}${emdash.string.capitalize(operation)}Document`;
  }

  static hook(name: string, operation: string, modifier: string) {
    return `use${emdash.string.capitalize(name)}${modifier}${emdash.string.capitalize(operation)}`;
  }

  static refetch(name: string, operation: string) {
    return `refetch${emdash.string.capitalize(name)}${emdash.string.capitalize(operation)}`;
  }
}
