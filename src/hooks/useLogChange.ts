import { useEffect } from "react";

export const useLogChange = (value: unknown, name: string) => {
  useEffect(() => {
    console.log(`${name} changed to`, value);
  }, [value, name]);
}; 