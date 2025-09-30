// src/utils/tabbar.ts
import Taro from "@tarojs/taro";

/**
 * 更新退货单 TabBar 角标数量
 * @param count 数量
 * @param tabIndex TabBar 中的索引位置
 */
export function updateBadge(count: number, tabIndex: number = 1) {
  if (count > 0) {
    Taro.setTabBarBadge({
      index: tabIndex,
      text: count > 99 ? "99+" : String(count),
    });
  } else {
    Taro.removeTabBarBadge({
      index: tabIndex,
    });
  }
}
