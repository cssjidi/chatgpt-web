import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

export function useBasicLayout() {
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = breakpoints.smaller('sm')
  const isWechat = /(micromessenger)/i.test(navigator.userAgent)
  return { isMobile, isWechat }
}
