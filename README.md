# HTML 在线编辑器

一个可以上传、在线编辑并实时预览 HTML 文件的简易 Web 应用。

## 功能特性

- 上传 `.html` 或 `.htm` 文件后即可在线编辑。
- 支持一键预览，在同一页面内实时查看渲染效果。
- 保存时会覆盖原文件，保持原文件名不变。
- 记录已上传的文件，方便后续再次编辑。

## 快速开始

```bash
pip install -r requirements.txt
python app.py
```

应用默认运行在 [http://localhost:5000](http://localhost:5000)。

## 项目结构

```
.
├── app.py              # Flask 应用入口
├── requirements.txt    # 依赖列表
├── templates/          # Jinja2 模板
├── static/             # 前端静态资源
└── uploads/            # 保存上传的 HTML 文件
```

## 注意事项

- 单个文件上传大小限制为 16MB。
- 仅支持上传 HTML 文件，为保证安全会对文件名进行过滤。
