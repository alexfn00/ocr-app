// src/hooks/useAuthGuard.ts
import { useEffect } from 'react'
import Taro from '@tarojs/taro'

export function useAuthGuard() {
  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [])
}
