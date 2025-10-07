// 全局变量和函数定义

// 检查是否有打开的文档
if (app.documents.length == 0) {
    alert("请先创建一个新文档并运行前一个脚本。");
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

    // 修正后的起始坐标计算
    // 遍历所有文档对象，找到最左和最上位置
    var allItems = doc.pageItems;
    if (allItems.length > 0) {
        var mostLeft = allItems[0].left;
        var mostTop = allItems[0].top;

        for (var i = 1; i < allItems.length; i++) {
            if (allItems[i].left < mostLeft) {
                mostLeft = allItems[i].left;
            }
            if (allItems[i].top < mostTop) {
                mostTop = allItems[i].top;
            }
        }
        
        var currentX = mostLeft;
        var currentY = mostTop - blockHeight - textHeight - vSpacing;
        var blockCount = 0;
        
    } else {
        // 如果文档为空，则使用默认起始位置
        var startX = 10 * mmToPt; // 10mm 边距
        var startY = doc.height - 10 * mmToPt; // 10mm 边距
        var currentX = startX;
        var currentY = startY;
        var blockCount = 0;
    }

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
            currentX = 10 * mmToPt;
            currentY -= blockHeight + textHeight + vSpacing;
            blockCount = 0;
        }

        // 如果达到批次大小，强制 Illustrator 刷新以避免崩溃
        if (processedCount >= batchSize) {
            app.redraw();
            processedCount = 0;
        }
    }

    // 仅生成四色组合
    function generateFourColorSwatches() {
        var c, m, y, k;
        
        for (c = 0; c <= 100; c += step) {
            for (m = 0; m <= 100; m += step) {
                for (y = 0; y <= 100; y += step) {
                    for (k = 0; k <= 100; k += step) {
                        createSwatch(c, m, y, k);
                    }
                }
            }
        }
    }

    // 调用主函数开始生成
    generateFourColorSwatches();
}
