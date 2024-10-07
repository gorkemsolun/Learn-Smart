import GlobalVariables from "@/app/global-variables";

const globalVariables = GlobalVariables.getInstance();

export function printDebugMessage(message: any, data?: any) {
  if (globalVariables.debug_mode) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}
