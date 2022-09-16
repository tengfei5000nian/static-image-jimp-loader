# jimp loader for webpack

一个webpack的loader，用来快捷修改静态图片。

> NOTE: Node v10+ and webpack v4+ are supported and tested.

## 关于

在开发时你不用再切换到图片编辑器修改图片了，这个loader可以帮你快捷的修改图片大小，替换颜色，翻转或旋转图片。

## 安装

`npm install --save-dev static-image-jimp-loader`

## webpack配置文件中全局配置

```js
import jimp from 'jimp'

const webpackConfig = {
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|bmp|gif)(\?.*)?$/,
                use: [
                    {
                        loader: 'static-image-jimp-loader',
                        options: {
                            // 包含高度和宽度范围内的图像。
                            //
                            // value: [width, height, align?, mode?]
                            contain: [750, jimp.AUTO, jimp.VERTICAL_ALIGN_TOP | jimp.HORIZONTAL_ALIGN_LEFT, jimp.RESIZE_BEZIER],
                            // 缩放图像，使给定的宽度和高度保持纵横比。
                            //
                            // value: [width, height, align?, mode?]
                            cover: [750, jimp.AUTO, jimp.VERTICAL_ALIGN_TOP | jimp.HORIZONTAL_ALIGN_LEFT, jimp.RESIZE_BEZIER],
                            // 沿图像的x轴或y轴翻转图像。
                            //
                            // value: [horizontal, vertical]
                            flip: [true, false],
                            // 调整图像大小。
                            //
                            // value: [width, height, mode?]
                            resize: [750, jimp.AUTO, jimp.RESIZE_BEZIER],
                            // 旋转图像。
                            //
                            // value: [deg, mode?]
                            rotate: [90, jimp.RESIZE_BEZIER],
                            // 将图像均匀缩放一个因子。
                            //
                            // value: [f, mode?]
                            scale: [1, jimp.RESIZE_BEZIER],
                            // 将图像缩放到适合具有给定宽度和高度的矩形内的最大尺寸。
                            //
                            // value: [w, h, mode?]
                            scaleToFit: [100, 100, jimp.RESIZE_BEZIER],
                            // 各种颜色处理方法。
                            //
                            // 支持jimp的image.color方法，See https://github.com/oliver-moran/jimp/tree/master/packages/plugin-color
                            color: [{ apply: 'red', params: [100] }],
                            // 特殊路径资源配置。
                            //
                            // value: 与整体配置差不多，special中的special无效
                            special: [
                                {
                                    test: /img\/test\.png/,
                                    options: {
                                        contain: [750, jimp.AUTO, jimp.VERTICAL_ALIGN_TOP | jimp.HORIZONTAL_ALIGN_LEFT, jimp.RESIZE_BEZIER],
                                        color: [{ apply: 'green', params: [100] }],
                                        ...
                                    }
                                }
                            ],
                            scale: [1, jimp.RESIZE_BEZIER],
                            // 是否向下合并配置。
                            //
                            // value: true|false
                            merge: true,
                            // 使用的方法顺序。
                            //
                            // value: ['resize', 'contain', 'cover', 'flip', 'rotate', 'scale', 'scaleToFit', 'color']
                            methods: ['cover', 'color']
                        }
                    }
                ]
            }
        ]
    }
}

module.exports = webpackConfig
```

## 通过图片链接参数修改单个图片转换配置

```js
// test.js
import '@/img/test_image.jpg?cover=500,500&color=red,100,green,100&rotate=45,bezier'
// 以下链接参数相同但顺序不同，这会创建两个module，生成两张图片。另外顺序不同也会在编译时造成执行方法的顺序不同，生成的图片也就会不同。
// import '@/img/test_image.jpg?cover=500,500&rotate=45,bezier&color=red,100,green,100'
// import '@/img/test_image.jpg?cover=500,500&color=red,100,green,100&rotate=45,bezier'

// 在loader中这个图片的query
{
    cover: [500, 500],
    color: [
        { apply: 'red': params: [100] },
        { apply: 'green': params: [100] }
    ],
    rotate: [45, jimp.RESIZE_BEZIER]
}
```
