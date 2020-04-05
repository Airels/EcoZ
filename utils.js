"use strict"

exports.getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}

exports.arrayToString = (array) => {
    var string = "";

    array.forEach(e => {
        string += e + ",";
    });

    return string.substring(0, string.length-1);
}