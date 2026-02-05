import { useEffect } from 'react'

export const useLogChange = (value: unknown, name: string) => {
  useEffect(() => {
    // Removed debugging console.log
  }, [value, name])
}
