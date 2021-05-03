var Assert = {};
Assert.defined = function(objArray) {
    if(objArray.length === undefined)
        throw "objArray.length not defined";
    for(var i = 0; i < objArray.length; i++){
        if(objArray[i] === undefined){
            console.error(objArray);
            throw "Undefined at position " + i;
        }
            
        if(Number.isNaN(objArray[i])){
            console.error(objArray);
            throw "NaN at position " + i;
        }
    }
};