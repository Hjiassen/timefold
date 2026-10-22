# Timefold

**把视频折叠成一条可以漫游的时间切片。**

Timefold 按时间间隔从视频中抽帧，将画面转换为粒子，并按时间放到 X 轴上。它是一个在浏览器中运行的视觉实验，让每个瞬间都同时留在场景里，便于观察动作如何随时间展开。

[English](README.md)

![Node.js 20.19+](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=node.js&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r180-black?logo=threedotjs)
![License: MIT](https://img.shields.io/badge/License-MIT-54a36a.svg)

![Timefold 时空视图](docs/assets/timefold-overview.jpg)

## 功能

- 按可调时间间隔采样本地视频，并让全部时间切片同时留在场景中。
- 将单帧铺在 YZ 平面上，以 X 轴表示时间。
- 把像素渲染为 GPU 粒子，支持原始色、单色和光谱映射。
- 根据相邻采样帧的 RGB 差异突出变化区域；扫描面跟随播放位置移动。
- 提供时间长廊、瞬间窗口、时间侧剖视角，以及拖动旋转、滚轮缩放、PNG 导出和播放控制。

这是一个交互式可视化原型，不是视频编辑器或运动追踪系统。变化高亮依据像素差异，不识别物体。

## 本地运行

需要 Node.js `20.19+`，以及支持 WebGL 的浏览器。克隆仓库后，在项目目录中运行：

```sh
cd Timefold
npm ci
npm run dev
```

打开 Vite 输出的本地地址，导入本地视频并调整采样间隔。不导入视频时，也可以直接查看内置的雨夜示例场景。

```sh
npm test
npm run build
```

## 操作

| 控件 | 作用 |
| --- | --- |
| 播放位置或播放按钮 | 沿时间移动；全部切片始终保留在场景中 |
| 时间长廊 / 瞬间窗口 / 时间侧剖 | 切换相机视角 |
| 拖动画布 | 旋转坐标系 |
| 在画布上滚动鼠标 | 缩放坐标系 |
| 粒子控制 | 调整采样密度、粒子尺寸与色彩映射 |
| 导出画面 | 将当前场景保存为 PNG |

## 工作方式

```text
本地视频 -> 等间隔时间点 -> Canvas 抽帧
         -> RGB 像素差异 -> YZ 平面粒子几何体
         -> 按时间排列到 X 轴 -> Three.js 浏览器渲染
```

场景和逐帧差异逻辑位于 `src/main.js` 与 `src/sampling.js`。纯几何及像素辅助函数由 `src/*.test.js` 中的 Node 测试覆盖。

## 隐私与限制

视频在浏览器中解码和处理；本项目没有视频上传服务或后端。界面目前从 Google Fonts 加载字体。播放格式取决于浏览器能否解码视频所使用的编码。采样越密、视频分辨率越高，内存占用和 GPU 工作量越大。

## 参与贡献

欢迎提交问题、聚焦的功能建议和 Pull Request。提交前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，保持改动范围清晰，运行 `npm test` 与 `npm run build`；涉及视觉的修改请附截图。

## 许可证

Timefold 使用 [MIT 许可证](LICENSE)。
