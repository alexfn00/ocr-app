import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useDidShow, useDidHide } from '@tarojs/taro'
// 全局样式
import '@nutui/nutui-react-taro/dist/style.css';
import './app.scss'

function App(props) {

  useEffect(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        traceUser: true,   // 是否开启用户追踪（可选）
      })
    }
  }, [])


  // 对应 onShow
  useDidShow(() => { })

  // 对应 onHide
  useDidHide(() => { })

  return props.children
}

export default App
