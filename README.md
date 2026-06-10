# MyErrorBook

AI 错题集 MVP。当前版本先实现 Web 端闭环：微信 OAuth 登录模拟、拍照/图片上传识别、错题确认、每日一题、自动批改、知识点诊断和三栏草稿区布局。

## 运行

```bash
cd apps/server
go run ./cmd/api
```

```bash
cd apps/web
npm install
npm run dev
```

Web 默认连接 `http://localhost:8080`。

## 安全

不要提交真实密钥、Token、手机号样例、微信 AppSecret、AI API Key、数据库密码、上传图片和日志文件。只提交 `.env.example`。
