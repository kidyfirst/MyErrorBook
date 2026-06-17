# MyErrorBook

<p style="color: red; font-weight: 700;">该项目开发中，当前版本仅用于 MVP 验证，请勿用于生产环境。</p>

AI 错题集 MVP。当前版本先实现 Web 端闭环：微信 OAuth 登录模拟、拍照/图片上传识别、错题确认、每日一题、自动批改、知识点诊断、三栏草稿区布局，以及基于 TinyMCE 5 + MathLive + MathJax 的 `RichEditor` 数学富文本答题组件。

## 运行

后端：

```bash
cd apps/server
go run ./cmd/api
```

前端，在仓库根目录执行：

```bash
pnpm install
pnpm dev:web
```

Web 默认连接 `http://localhost:8080`。

## 安全

不要提交真实密钥、Token、手机号样例、微信 AppSecret、AI API Key、数据库密码、上传图片和日志文件。只提交 `.env.example`。
