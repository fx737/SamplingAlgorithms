//import {_limitValue, _lookupByKey, isNullOrUndef, resolve} from '../helpers';

// let sd = formatDate(document.getElementById("start").value);
// let ed = formatDate(document.getElementById("end").value); 
// let rangeValue = document.getElementById("myRange").value;

// fetchData(sd, ed, rangeValue);

document.getElementById("myRange").oninput = function() {
  sd = formatDate(document.getElementById("start").value);
  ed = formatDate(document.getElementById("end").value); 

  fetchData(sd, ed, this.value);
}

document.getElementById("start").addEventListener('change', function() {
  sd = formatDate(this.value);
  ed = formatDate(document.getElementById("end").value); 
  rangeValue = document.getElementById("myRange").value;

  fetchData(sd, ed, rangeValue);
});

document.getElementById("end").addEventListener('change', function() {
  sd = formatDate(document.getElementById("start").value);
  ed = formatDate(this.value); 
  rangeValue = document.getElementById("myRange").value;

  fetchData(sd, ed, rangeValue);
});


async function fetchData (sd, ed, threshold){
  
await fetch(`http://localhost:8080/values/${sd}?endDate=${ed}&threshold=${threshold}`)
//await fetch(`http://localhost:8080/weather`)
.then(response => response.json())
.then(Data => {
  
//Data.forecast.forecastday.forEach(obj => {
//  obj.hour.forEach(element => data.push([element.time_epoch*1000, element.wind_kph]))
//})

//let sampledData = largestTriangleThreeBuckets(data, threshold, 0, 1);
//let sampledData = minMaxDecimation(data, 0, 1, 10)

console.log(`Data = ${Data.Data.length}, sampledData1 = ${Data.sampledData1.length}, sampledData2 = ${Data.sampledData2.length}, threshold = ${threshold}%`);

// Initialize the ECharts instance based on the prepared DOM
var myChart = echarts.init(document.getElementById('main'));


// Specify the configuration items and data for the chart
var option;

option = {
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: function (value, index) {
          return echarts.format.formatTime('yyyy-MM-dd h:m:s', value);
      } }
  },
  yAxis: {
    type: 'value'
  },
  legend: {
    data: ['Normal Data', 'Sampled Data 1', 'Sampled Data 2']
  },  
  series: [
    {
      name: 'Normal Data',
      data: Data.Data,
      type: 'line'
    } ,
    {
      name: 'Sampled Data 1',
      data: Data.sampledData1,
      type: 'line'
    },
    {
      name: 'Sampled Data 2',
      data: Data.sampledData2,
      type: 'line'
    } 
  ],
  dataZoom: [
    {
      type: 'slider',
      show: true,
      xAxisIndex: [0],
      start: 0,
      end: 0.5
    },
    { 
      type: 'inside',
      xAxisIndex: [0],
      start: 0,
      end: 0.5
    }
  ]
};



// Use the specified chart configuration items and data to show the chart
myChart.setOption(option);


})
.catch(error => console.error(error));
}




//------------------------------------------------------------------------------
function minMaxDecimation(data, start, count, availableWidth) { 
  let avgX = 0; 
  let countX = 0; 
  let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY; 
  const decimated = []; 
  const endIndex = start + count - 1; 
 
  const xMin = data[start].x; 
  const xMax = data[endIndex].x; 
  const dx = xMax - xMin; 
 
  for (i = start; i < start + count; ++i) { 
    point = data[i]; 
    x = (point.x - xMin) / dx * availableWidth; 
    y = point.y; 
    const truncX = x | 0; 
 
    if (truncX === prevX) { 
      // Determine `minY` / `maxY` and `avgX` while we stay within same x-position 
      if (y < minY) { 
        minY = y; 
        minIndex = i; 
      } else if (y > maxY) { 
        maxY = y; 
        maxIndex = i; 
      } 
      // For first point in group, countX is `0`, so average will be `x` / 1. 
      // Use point.x here because we're computing the average data `x` value 
      avgX = (countX * avgX + point.x) / ++countX; 
    } else { 
      // Push up to 4 points, 3 for the last interval and the first point for this interval 
      const lastIndex = i - 1; 
 
      if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) { 
        // The interval is defined by 4 points: start, min, max, end. 
        // The starting point is already considered at this point, so we need to determine which 
        // of the other points to add. We need to sort these points to ensure the decimated data 
        // is still sorted and then ensure there are no duplicates. 
        const intermediateIndex1 = Math.min(minIndex, maxIndex); 
        const intermediateIndex2 = Math.max(minIndex, maxIndex); 
 
        if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) { 
          decimated.push({ 
            ...data[intermediateIndex1], 
            x: avgX, 
          }); 
        } 
        if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) { 
          decimated.push({ 
            ...data[intermediateIndex2], 
            x: avgX 
          }); 
        } 
      } 
 
      // lastIndex === startIndex will occur when a range has only 1 point which could 
      // happen with very uneven data 
      if (i > 0 && lastIndex !== startIndex) { 
        // Last point in the previous interval 
        decimated.push(data[lastIndex]); 
      } 
 
      // Start of the new interval 
      decimated.push(point); 
      prevX = truncX; 
      countX = 0; 
      minY = maxY = y; 
      minIndex = maxIndex = startIndex = i; 
    } 
  } 
 
  return decimated; 
} 

function formatDate(dateValue) {
  const date = new Date(dateValue);
  const month = date.getMonth() + 1; // Months are zero-based
  const day = date.getDate();
  const year = date.getFullYear();

  // Add leading zeros if necessary
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${formattedMonth}-${formattedDay}-${year}`;
}

