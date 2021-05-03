var GfxUtils = {};

GfxUtils.setPixel = function (imageData, { x, y }, { r, g, b, a }) {
    Assert.defined([imageData, x, y, r, g, b, a ]);
    var index = (y * (imageData.width) + x) * 4;
    imageData.data[index + 0] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
    imageData.data[index + 3] = a;
}
GfxUtils.getPixel = function (imageData, { x, y }) {
    Assert.defined([imageData, x, y]);
    var index = (y * (imageData.width) + x) * 4;
    var color = {
        r: imageData.data[index + 0],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3]
    };
    if (color.r === undefined)
        throw "Invalid position: " + x + " x " + y + ", index: " + index + ", imageData.width: " + imageData.width + ", imageData.data.length: " + imageData.data.length;
    return color;
}

GfxUtils.paintSquare = function (imageData, { x, y, width, height }, { r, g, b, a }) {
    Assert.defined([imageData, x, y, width, height, r, g, b, a ]);
    for (var xPos = x; xPos < x + width; xPos++) {
        for (var yPos = y; yPos < y + height; yPos++) {
            GfxUtils.setPixel(imageData, { x: xPos, y: yPos }, { r: r, g: g, b: b, a: a });
        }
    }
}

GfxUtils.loadImageAsync = async function (src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(src + " failed loading.");
        img.src = src;
    });
}

GfxUtils.loadImageDataAsync = async function (src) {
    var img = await loadImageAsync(src);
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}

GfxUtils.loadGfxInfo = function (canvas) {
    var info = {};
    info.canvas = canvas;
    info.context = canvas.getContext("2d");
    info.imgData = info.context.getImageData(0, 0, canvas.width, canvas.height);
    return info;
}

GfxUtils.createSpriteAsync = async function (filename) {
    var sprite = {};

    var orgImg = await GfxUtils.loadImageAsync(filename);

    // Create a canvas big enought for the image to rotate on all sides in it
    var canvasSize = parseInt(Math.max(orgImg.width, orgImg.height) * 1.42);

    var rotatedImgData = [];

    for (var rotInDegrees = 0; rotInDegrees < 360; rotInDegrees++) {

        var canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        var gfxInfo = GfxUtils.loadGfxInfo(canvas);

        // Clear and draw
        var rotationInRad = (rotInDegrees / 180) * Math.PI;

        gfxInfo.context.clearRect(0, 0, canvasSize, canvasSize);
        gfxInfo.context.translate(canvasSize / 2, canvasSize / 2);
        gfxInfo.context.rotate(rotationInRad);
        // Draw image in the middle
        gfxInfo.context.drawImage(orgImg, -orgImg.width / 2, -orgImg.height / 2);

        var imgData = gfxInfo.context.getImageData(0, 0, canvasSize, canvasSize);
        rotatedImgData.push(imgData);
    }

    sprite.rotatedImgData = rotatedImgData;
    sprite.width = canvasSize;
    sprite.height = canvasSize;
    sprite.x = 0;
    sprite.y = 0;
    var rotationDegrees = 0;
    sprite.setRotation = function({rotDegrees}){
        rotDegrees = parseInt(rotDegrees);
        if(rotDegrees < 0 || rotDegrees >= 360)
            throw "Invalid rotDegrees: " + rotDegrees;
        rotationDegrees = rotDegrees;
    };
    sprite.paintOnImgData = function ({ imgData }) {
        var carImgData = sprite.getCurrentRotatedImage();
        for (var x = 0; x < sprite.width; x++) {
            for (var y = 0; y < sprite.height; y++) {

                var targetX = sprite.x - sprite.width / 2 + x;
                var targetY = sprite.y - sprite.height / 2 + y;
                if (targetX < 0 || targetX >= imgData.width || targetY < 0 || targetY >= imgData.height) {
                    continue; // Outside of imgData
                }

                var color = GfxUtils.getPixel(carImgData, { x: x, y: y });
                if (color.a > 200) {
                    GfxUtils.setPixel(imgData, { x: targetX, y: targetY }, color);
                }
            }
        }
    }

    sprite.getCurrentRotatedImage = function () {
        var img = rotatedImgData[rotationDegrees];
        if(!img)
            throw "No image at position " + rotationDegrees;
        return img;
    }
    sprite.checkCollisionWithImgData = function ({ imgData }) {
        var carImgData = sprite.getCurrentRotatedImage();
        for (var x = 0; x < sprite.width; x++) {
            for (var y = 0; y < sprite.height; y++) {

                var targetX = sprite.x - sprite.width / 2 + x;
                var targetY = sprite.y - sprite.height / 2 + y;
                Assert.defined([targetX, targetY]);
                
                if (targetX < 0 || targetX >= imgData.width || targetY < 0 || targetY >= imgData.height) {
                    continue; // Outside of imdData
                }
                var carColor = GfxUtils.getPixel(carImgData, { x: x, y: y });
                if (carColor.a != 0) {
                    var targetColor = GfxUtils.getPixel(imgData, { x: targetX, y: targetY });
                    if (targetColor.a != 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    sprite.checkCollisionWithSprite = function ({ otherSprite }) {
        var currentImg = sprite.getCurrentRotatedImage();
        var otherImgData = otherSprite.getCurrentRotatedImage();

        // If comlpetely outsite of each others square - make a quick skip
        if (sprite.x - sprite.width / 2 > otherSprite.x + otherSprite.width / 2)
            return false;
        if (sprite.x + sprite.width / 2 < otherSprite.x - otherSprite.width / 2)
            return false;

        if (sprite.y - sprite.height / 2 > otherSprite.y + otherSprite.height / 2)
            return false;
        if (sprite.y + sprite.height / 2 < otherSprite.y - otherSprite.height / 2)
            return false;

        var minScreenX = Math.max(0, sprite.x - sprite.width / 2);
        var maxScreenX = Math.min(WIDTH - 1, sprite.x + sprite.width / 2);

        var minScreenY = Math.max(0, sprite.y - sprite.height / 2);
        var maxScreenY = Math.min(HEIGHT - 1, sprite.y + sprite.height / 2);

        for (var screenX = minScreenX; screenX <= maxScreenX; screenX++) {
            for (var screenY = minScreenY; screenY <= maxScreenY; screenY++) {

                var sprite1X = screenX - sprite.x + sprite.width / 2;
                var sprite1Y = screenY - sprite.y + sprite.width / 2;

                if (sprite1X < 0 || sprite1X >= sprite.width || sprite1Y < 0 || sprite1Y >= sprite.height)
                    continue;

                var sprite2X = screenX - otherSprite.x + otherSprite.width / 2;
                var sprite2Y = screenY - otherSprite.y + otherSprite.height / 2;

                if (sprite2X < 0 || sprite2X >= otherSprite.width || sprite2Y < 0 || sprite2Y >= otherSprite.height)
                    continue;

                var color1 = GfxUtils.getPixel(currentImg, { x: sprite1X, y: sprite1Y });
                if (color1.a != 0) {
                    var otherColor = GfxUtils.getPixel(otherImgData, { x: sprite2X, y: sprite2Y });
                    if (otherColor.a != 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }


    return sprite;
}