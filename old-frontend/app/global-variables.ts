// Class to store global variables that can be accessed from any component
export default class GlobalVariables {
  // Singleton instance
  private static instance: GlobalVariables;

  debug_mode: boolean = false;

  private constructor() {}

  // Singleton pattern to ensure only one instance is used
  public static getInstance(): GlobalVariables {
    if (!GlobalVariables.instance) {
      GlobalVariables.instance = new GlobalVariables();
    }

    return GlobalVariables.instance;
  }

  // BELOW FOR CUSTOM GLOBAL VARIABLES

  /* private variables: { [key: string]: any } = {}; */
  /* // Method to set a global variable
  public setVariable(key: string, value: any): void {
    this.variables[key] = value;
  }

  // Method to get a global variable
  public getVariable(key: string): any {
    return this.variables[key];
  }

  // Method to check if a global variable exists
  public hasVariable(key: string): boolean {
    return key in this.variables;
  }

  // Method to remove a global variable
  public removeVariable(key: string): void {
    delete this.variables[key];
  } */
}
