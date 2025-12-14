import React from "react";
import { EyeOutlined, UserOutlined } from "@ant-design/icons";
import "./Footer.scss";

type FooterStats = {
  pageViews: number;
  visitors: number;
};

/**
 * 格式化数字，添加千位分隔符。
 *
 * @param num - 要格式化的数字
 * @returns 格式化后的字符串
 *
 * @example
 * ```ts
 * formatNumber(1234567); // "1,234,567"
 * ```
 */
function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN");
}

/**
 * 页面底部组件，包含版权信息、统计数据和备案信息。
 */
export function Footer() {
  const [stats, setStats] = React.useState<FooterStats>({
    pageViews: 0,
    visitors: 0,
  });

  // 从环境变量读取配置
  const siteName = import.meta.env.VITE_SITE_NAME || "Max Zhang";
  const copyrightYear = import.meta.env.VITE_COPYRIGHT_YEAR || "2024";
  const icpNumber = import.meta.env.VITE_ICP_NUMBER || "";
  const icpUrl = import.meta.env.VITE_ICP_URL || "https://beian.miit.gov.cn/";
  const beianNumber = import.meta.env.VITE_BEIAN_NUMBER || "";
  const beianUrl =
    import.meta.env.VITE_BEIAN_URL || "http://www.beian.gov.cn/portal/registerSystemInfo";

  // 调试信息
  React.useEffect(() => {
    console.log("Environment variables:", {
      VITE_ICP_NUMBER: import.meta.env.VITE_ICP_NUMBER,
      VITE_BEIAN_NUMBER: import.meta.env.VITE_BEIAN_NUMBER,
      icpNumber,
      beianNumber,
      hasBeian: !!(icpNumber || beianNumber),
    });
  }, [icpNumber, beianNumber]);

  // 获取统计数据（可选）
  React.useEffect(() => {
    // TODO: 从API获取真实统计数据
    // 目前使用模拟数据
    setStats({
      pageViews: 12345,
      visitors: 6789,
    });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* 版权信息 */}
          <div className="footer-section">
            <p className="copyright">
              &copy; {copyrightYear} {siteName}. All rights reserved.
            </p>
          </div>

          {/* 统计信息 */}
          <div className="footer-section">
            <div className="stats">
              <span className="stat-item">
                <EyeOutlined className="stat-icon" />
                浏览量: <span className="stat-number">{formatNumber(stats.pageViews)}</span>
              </span>
              <span className="stat-item">
                <UserOutlined className="stat-icon" />
                访客数: <span className="stat-number">{formatNumber(stats.visitors)}</span>
              </span>
            </div>
          </div>

          {/* 备案信息 */}
          {(icpNumber || beianNumber) && (
            <div className="footer-section">
              <div className="beian-info">
                {icpNumber && (
                  <div className="beian-item">
                    <a href={icpUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src="/icp.png"
                        alt=""
                        className="beian-icon"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {icpNumber}
                    </a>
                  </div>
                )}
                {beianNumber && (
                  <div className="beian-item">
                    <a href={beianUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src="/beian.png"
                        alt=""
                        className="beian-icon"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {beianNumber}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
