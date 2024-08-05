const express  = require('express');
const app = express();
const port = 8080;
const cors = require("cors");

app.use(express.json());
app.use(cors({origin: "http://127.0.0.1:5500"}));

const { Client } = require('pg');
 
const client = new Client({
	user: 'postgres',
	password: 'qwer',
	host: 'localhost',
	port: '5432',
	database: 'postgres',
});

client
	.connect()
	.then(() => {
		console.log('Connected to PostgreSQL database');
	})
	.catch((err) => {
		console.error('Error connecting to PostgreSQL database', err);
	});




/*    client
	.end()
	.then(() => {
		console.log('Connection to PostgreSQL closed');
	})
	.catch((err) => {
		console.error('Error closing connection', err);
	});

*/

app.get('/values/:startDate', (req, res) => {
    const {startDate} = req.params;
    const {endDate} = req.query;
    const {threshold} = req.query;

    let sDate = Math.round(new Date(startDate).getTime()/1000); 
    let eDate = Math.round(new Date(endDate).getTime()/1000); 

 
    if (startDate == ':startDate' || startDate == "") {
        res.status(400).send({ERROR: "Please pass the start date."}); 
        return;    
    }
    else if(!isValidDateFormat(startDate) || ((endDate=="")?false:!isValidDateFormat(endDate))) {
        res.status(400).send({ERROR: "Invlaid date format, please pass the date in MM-DD-YYYY"});
        return;
    } else if (sDate > eDate) {
        res.status(400).send({ERROR: "The start date is greater than the end date."}); 
        return;
    }
    else if(sDate*1000 > Date.now()){
        res.status(400).send({ERROR: "The start date entered is later than the current time."});    
        return; 
    }

    else { 

        //console.log(sDate, eDate);

        client.query(`SELECT * FROM points WHERE time > ${sDate} AND time < ${eDate};`, (err, result) => {
            if (err) {
                console.error('Error executing query', err);
            } else {
                let data = result.rows.map(obj => [obj.time*1000, obj.value]);
                let downsampler = require("downsample-lttb");
       

                //const { minMaxDecimation } = import('./Chart.js/src/plugins/plugin.decimation.js');

                // Use the function
              
                let startTime = performance.now();
                let SampledData2 = minMaxDecimation(result.rows, 0, result.rows.length, threshold/100).map((obj => [obj.time*1000, obj.value]));
                let endTime = performance.now();

                console.log(`Execution time of minMax: ${endTime-startTime}`);

                
                startTime = performance.now();
                let SampledData1 = largestTriangleThreeBuckets(data, Math.floor(data.length*(threshold/100)), 0, 1); 
                endTime = performance.now();

                console.log(`Execution time of lttb (from gitHub): ${endTime-startTime}`);

                startTime = performance.now();
                let SampledData3 = downsampler.processData(data, Math.floor(data.length*(threshold/100)));
                endTime = performance.now();

                console.log(`Execution time of lttb (npm): ${endTime-startTime}`, '\n');

                
                res.status(200).send({
                    Data: data,
                    sampledData1:SampledData3 ,
                    sampledData2: SampledData2
                    
                    //sampledData2: downsampler.processData(data, Math.floor(data.length*(threshold/100)))
                });
            }
    
        });
   
        


}
    }
);

/*app.get('/weather', async (req, res) => {
    const response = await fetch('http://api.weatherapi.com/v1/forecast.json?key=f26caf31eb85446583693032242907&q=London&days=7&aqi=no&alerts=no');
    const data = await response.json();
    res.json(data);
  });
*/


app.listen(
    port,
    () => console.log(`Alive on http://localhost:${port}`)
);




function isValidDateFormat(input) {
    // Regular expression to match MM-DD-YYYY format
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;

    // Check if the input matches the regex
    return regex.test(input);
}




function largestTriangleThreeBuckets( data, threshold, xAccessor, yAccessor ) {

    var floor = Math.floor,
      abs = Math.abs,
      dataLength = data.length,
      sampled = [],
      sampledIndex = 0,
      every = ( dataLength - 2 ) / ( threshold - 2 ), // Bucket size. Leave room for start and end data points
      a = 0, // Initially a is the first point in the triangle
      maxAreaPoint,
      maxArea,
      area,
      nextA,
      i,
      avgX = 0,
      avgY = 0,
      avgRangeStart,
      avgRangeEnd,
      avgRangeLength,
      rangeOffs,
      rangeTo,
      pointAX,
      pointAY;
  
    if ( threshold >= dataLength || threshold === 0 ) {
      return data; // Nothing to do
    }
  
    sampled[ sampledIndex++ ] = data[ a ]; // Always add the first point
  
    for ( i = 0; i < threshold - 2; i++ ) {
  
      // Calculate point average for next bucket (containing c)
      avgX = 0;
      avgY = 0;
      avgRangeStart = floor( ( i + 1 ) * every ) + 1;
      avgRangeEnd = floor( ( i + 2 ) * every ) + 1;
      avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
  
      avgRangeLength = avgRangeEnd - avgRangeStart;
  
      for ( ; avgRangeStart < avgRangeEnd; avgRangeStart++ ) {
        avgX += data[ avgRangeStart ][ xAccessor ] * 1; // * 1 enforces Number (value may be Date)
        avgY += data[ avgRangeStart ][ yAccessor ] * 1;
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
  
      // Get the range for this bucket
      rangeOffs = floor( ( i + 0 ) * every ) + 1;
      rangeTo   = floor( ( i + 1 ) * every ) + 1;
  
      // Point a
      pointAX = data[ a ][ xAccessor ] * 1; // enforce Number (value may be Date)
      pointAY = data[ a ][ yAccessor ] * 1;
  
      maxArea = area = -1;
  
      for ( ; rangeOffs < rangeTo; rangeOffs++ ) {
        // Calculate triangle area over three buckets
        area = abs( ( pointAX - avgX ) * ( data[ rangeOffs ][ yAccessor ] - pointAY ) -
              ( pointAX - data[ rangeOffs ][ xAccessor ] ) * ( avgY - pointAY )
              ) * 0.5;
        if ( area > maxArea ) {
          maxArea = area;
          maxAreaPoint = data[ rangeOffs ];
          nextA = rangeOffs; // Next a is this b
        }
      }
  
      sampled[ sampledIndex++ ] = maxAreaPoint; // Pick this point from the bucket
      a = nextA; // This a is the next a (chosen b)
    }
  
    sampled[ sampledIndex++ ] = data[ dataLength - 1 ]; // Always add last
  
    return sampled;
  }


  function minMaxDecimation(data, start, count, threshold) {
    let avgX = 0;
    let countX = 0;
    let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
    const decimated = [];
    const endIndex = start + count - 1;
  
    const xMin = data[start].time;  
    const xMax = data[endIndex].time;
    const dx = xMax - xMin;
      
    for (i = start; i < start + count; ++i) {
      point = data[i];
      x = (point.time - xMin) / dx * count * threshold / 4;
      y = point.value;
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
        // Use point.time here because we're computing the average data `x` value
        avgX = (countX * avgX + point.time) / ++countX;
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
            });
          }
          if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
            decimated.push({
              ...data[intermediateIndex2],
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
  

  function isNullOrUndef(value) {
    return value === null || value === undefined;
  }
  