var http = require("http");
var https = require("https");

var options = {
    host: 'challenge.vinolytics.com',
    path: '/api/wines?project=gO5q4uYiNeYv3AX940Jt',
};

var wineList;
var wineDict = [];

var req = https.request(options, function(resp) {
    console.log('STATUS: ' + resp.statusCode);

    var data = '';

    resp.on('data', function(chunk) {
        data += chunk;
    }).on('end', function() {
        loadJSONObj(data);
    });
});

req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
});

req.end();

function loadJSONObj(data) {
    wineList = JSON.parse(data).data;

    for (var i = 0; i < wineList.length; i++) {
        wineDict[wineList[i].name] = wineList[i];
    }
    //console.log(wineDict);

    analyzeWines();
}

function analyzeWines() {
    var totalPrice = 0;
    var maxVintage = 0;
    var commonYears = {};
    var wine;
    for (var key in wineDict) {
        wine = wineDict[key];
        if (Number(wine.vintage) > maxVintage) maxVintage = Number(wine.vintage);
        totalPrice += Number(wine.bottlePrice);
        for (var i = Number(wine.windowBegin); i <= Number(wine.windowEnd); i++) {
            if (!commonYears.hasOwnProperty(i)) commonYears[i] = 1;
            else commonYears[i] += 1;
        }
    }
    var avgBottlePrices = totalPrice / Object.keys(wineDict).length;

    console.log(avgBottlePrices);
    console.log(maxVintage);

    var commonYearsArr = [];
    for (var key in commonYears) {
        commonYearsArr.push(key);
    }

    console.log(commonYearsArr);

    sendAnalysis(maxVintage, avgBottlePrices, commonYearsArr);
}

function sendAnalysis(maxVint, avgBtlPrices, commonYearsArr) {
    var responseObj = new Object();
    responseObj.data = {
        avgBottlePrice: Math.round(avgBtlPrices),
        maxVintage: maxVint,
        commonYears: commonYearsArr
    };
    responseObj.type = "analytics";
    responseObj.project = "gO5q4uYiNeYv3AX940Jt";

    var jsonResp = JSON.stringify(responseObj);

    var postOptions = {
        host: 'challenge.vinolytics.com',
        path: '/api/submit',
        method: 'POST',
        encoding: 'utf8',
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(jsonResp)
        }
    };

    console.log(jsonResp);

    var req = https.request(postOptions, function(res) {

        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.on('data', function(chunk) {
            console.log('BODY: ' + chunk);
        }).on('end', function() {
            console.log('Finshed');
        });

    });

    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });

    req.write(jsonResp);

    req.end();
}