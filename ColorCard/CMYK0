// 全局变量和函数定义

// 检查是否有打开的文档
if (app.documents.length == 0) {
    alert("请先创建一个新文档再运行脚本。");
} else {
    var doc = app.activeDocument;
    var layer = doc.activeLayer;

    // 将尺寸从厘米转换为毫米，并定义像素到点数的转换因子 (PPI)
    var mmToPt = 2.834645;

    // 定义色块和文本的尺寸（以毫米为单位）
    var blockWidthMM = 30; // 3cm
    var blockHeightMM = 20; // 2cm
    var textHeightMM = 5; // 文字高度

    // 将尺寸转换为 Illustrator 的点 (pt) 单位
    var blockWidth = blockWidthMM * mmToPt;
    var blockHeight = blockHeightMM * mmToPt;
    var textHeight = textHeightMM * mmToPt;

    // 定义布局参数
    var blocksPerRow = 44;
    var hSpacing = 1 * mmToPt; // 水平间距 1mm
    var vSpacing = 5 * mmToPt; // 垂直间距 5mm

    // 定义起始坐标
    var startX = 10 * mmToPt; // 10mm 边距
    var startY = doc.height - 10 * mmToPt; // 10mm 边距
    var currentX = startX;
    var currentY = startY;
    var blockCount = 0;

    // 定义 CMYK 步进
    var step = 10;

    // 定义批次处理参数
    var batchSize = 5000;
    var processedCount = 0;

    // 核心生成函数
    function createSwatch(c, m, y, k) {
        // 创建颜色对象
        var cmykColor = new CMYKColor();
        cmykColor.cyan = c;
        cmykColor.magenta = m;
        cmykColor.yellow = y;
        cmykColor.black = k;

        // 创建矩形色块
        var rect = layer.pathItems.rectangle(currentY, currentX, blockWidth, blockHeight);
        rect.fillColor = cmykColor;
        rect.stroked = false;

        // 创建文本框
        var textFrame = layer.textFrames.add();
        textFrame.contents = "C" + c + " M" + m + " Y" + y + " K" + k;

        // 设置文本大小并居中
        textFrame.textRange.characterAttributes.size = 6;
        textFrame.textRange.paragraphAttributes.justification = Justification.CENTER;
        
        // 计算文本框位置
        var textX = currentX;
        var textY = currentY - blockHeight - textHeight;
        textFrame.position = [textX, textY];
        textFrame.width = blockWidth;

        // 更新位置
        currentX += blockWidth + hSpacing;
        blockCount++;
        processedCount++;

        // 如果达到每行色块数，换行
        if (blockCount >= blocksPerRow) {
            currentX = startX;
            currentY -= blockHeight + textHeight + vSpacing;
            blockCount = 0;
        }

        // 如果达到批次大小，强制 Illustrator 刷新以避免崩溃
        if (processedCount >= batchSize) {
            app.redraw();
            processedCount = 0;
        }
    }

    // 主生成函数，按顺序调用各层级遍历
    function generateCMYKSwatches() {
        var i, j, k;

        // --- 1. 遍历纯色系（从C、M、Y、K开始） ---
        // C 纯色（C10 - C100）
        for (i = 10; i <= 100; i += step) { createSwatch(i, 0, 0, 0); }
        // M 纯色（M10 - M100）
        for (i = 10; i <= 100; i += step) { createSwatch(0, i, 0, 0); }
        // Y 纯色（Y10 - Y100）
        for (i = 10; i <= 100; i += step) { createSwatch(0, 0, i, 0); }
        // K 纯色（K10 - K100）
        for (i = 10; i <= 100; i += step) { createSwatch(0, 0, 0, i); }
        
        // --- 2. 遍历两色组合 ---
        // CM 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(i, j, 0, 0); }
        }
        // CY 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(i, 0, j, 0); }
        }
        // CK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(i, 0, 0, j); }
        }
        // MY 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(0, i, j, 0); }
        }
        // MK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(0, i, 0, j); }
        }
        // YK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) { createSwatch(0, 0, i, j); }
        }

        // --- 3. 遍历三色组合 ---
        // CMY 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) {
                for (k = 0; k <= 100; k += step) { createSwatch(i, j, k, 0); }
            }
        }
        // CMK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) {
                for (k = 0; k <= 100; k += step) { createSwatch(i, j, 0, k); }
            }
        }
        // CYK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) {
                for (k = 0; k <= 100; k += step) { createSwatch(i, 0, j, k); }
            }
        }
        // MYK 组合
        for (i = 0; i <= 100; i += step) {
            for (j = 0; j <= 100; j += step) {
                for (k = 0; k <= 100; k += step) { createSwatch(0, i, j, k); }
            }
        }
    }

    // 调用主函数开始生成
    generateCMYKSwatches();
}
