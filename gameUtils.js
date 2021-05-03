var CARS = {
    car_white: "car_white"
}

var GameUtils = {};
GameUtils.createCarAsync = async function({carImgPath}){
    var carSprite = await GfxUtils.createSpriteAsync(carImgPath);
    var car = {};
    car.sprite = carSprite;
    car.rotationDegrees = 0;
    var speed = 0;
    var keys = {};
    var key_speeder = "ArrowUp";
    var key_brake = "ArrowDown";
    var key_left = "ArrowLeft";
    var key_right = "ArrowRight";

    car.pressKey = function({e}){
        Assert.defined([e]);
        keys[e.key] = true;
    }
    car.releaseKey = function({e}){
        Assert.defined([e]);
        keys[e.key] = false;
    }
    
    car.setDirection = function({absoluteRotDegrees}){        
        Assert.defined([absoluteRotDegrees]);
        while(absoluteRotDegrees < 0)
            absoluteRotDegrees += 360;
        while(absoluteRotDegrees >= 360)
            absoluteRotDegrees -= 360;
        car.rotationDegrees = absoluteRotDegrees;
        car.sprite.setRotation({rotDegrees: absoluteRotDegrees});
    };
    car.addDirection = function({deltaRotDegrees}){
        Assert.defined([deltaRotDegrees]);
        car.setDirection({absoluteRotDegrees: car.rotationDegrees + deltaRotDegrees});
    };

    var x = 0;
    var y = 0;
    car.move = function({deltaX, deltaY}){
        Assert.defined([deltaX,deltaY]);
        x += deltaX;
        y += deltaY;
        car.sprite.x = parseInt(x);
        car.sprite.y = parseInt(y);
    }

    car.rewindALittle = function(){
        moveInCurrentDirection({distance: -1});
    };
    var moveInCurrentDirection = function({distance}){
        var dirRadians = car.rotationDegrees / 360 * 2 * Math.PI;
        Assert.defined([dirRadians, speed]);
        var deltaX = Math.cos(dirRadians) * distance;
        var deltaY = Math.sin(dirRadians) * distance;
        Assert.defined([deltaX, deltaY]);
        car.move({deltaX: deltaX, deltaY: deltaY});
    }
    car.update = function({deltaMs}){
        if(keys[key_left]){
            car.addDirection({deltaRotDegrees: -deltaMs/4});
        }
        if(keys[key_right]){
            car.addDirection({deltaRotDegrees: deltaMs/4});
        }
        
        if(keys[key_speeder]){
            speed += deltaMs / 50;
        }
        if(keys[key_brake]){
            speed -= deltaMs / 50;
        }

        moveInCurrentDirection({distance: speed * deltaMs / 100});
    };
    return car;
};

