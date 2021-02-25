let w, h, graphics, imgOld;
let imgScale = 2;
nrPointsX = 40;
nrPointsY = 24;
avgGridOld = [];
avgGridNew = [];
gridHist = [];
histLen = 30;
threshold = 5;
downsample = 4;
framerate = 30;
r = 3;

function getStepSize(tot, nrPoints) {
  stepInit = Math.floor(tot / (nrPoints + 1));
  return stepInit % 2 == 0 ? stepInit : stepInit - 1;
}

function range(n) {
  return Array.from(Array(n).keys());
}

function setup() {

  background(0);

  w = 320*imgScale;
  h = 240*imgScale;
  
  createCanvas(w, h);
  pixelDensity(1);
  graphics = createGraphics(w, h);
  graphics.clear();

  noStroke();
  graphics.noStroke();

  
  imgOld = null;

  capture = createCapture(VIDEO);
  capture.size(w, h);
  capture.hide();

  // Set up grid basics
  stepX = getStepSize(w, nrPointsX);
  stepY = getStepSize(h, nrPointsY);

  // Dummy for avgGridOld
  range(nrPointsX).forEach(i => {
    avgGridOld.push([]);
    range(nrPointsY).forEach(j => {
      avgGridOld[i].push([255, 255, 255]); // Will be filled to look like [r, g, b]
    });
  });

  // Dummy for avgGridNew
  range(nrPointsX).forEach(i => {
    avgGridNew.push([]);
    range(nrPointsY).forEach(j => {
      avgGridNew[i].push([255, 255, 255]); // Will be filled to look like [r, g, b]
    });
  });

  // Dummy for gridHistory
  range(histLen).forEach(t => {
    gridHist.push([]);
    range(nrPointsX).forEach(i => {
      gridHist[t].push([]);
      range(nrPointsY).forEach(j => {
        gridHist[t][i][j] = 0;
      });
    });
  });

  console.log(gridHist);
  
  frameRate(framerate);
}

function getAverage(arr, i, j) {
  cx = i * stepX + stepX/2;
  cy = j * stepY + stepY/2;
  //console.log('cx:' + cx + ' - cy:' + cy);

  var sum = [0, 0, 0] // [r, g b]
  range(3).forEach(k => {
    for (var x = cx - stepX/2; x <= cx + stepX/2; x += downsample) {
      for (var y = cy - stepY/2; y <= cy + stepY/2; y += downsample) {
        idx = (x + y * w) * 4 + k;
        sum[k] += arr[idx];
        //console.log('idx:' + idx);
      }
    }
    sum[k] = sum[k] / (stepX * stepY);
  });

  return sum;
}

function draw() {

  background(0);
  //graphics.clear();
  //tint(255,200);
  
  graphics.loadPixels();
  pixelsNew = graphics.pixels;

  alphFact = 0.95;
  pxShift = 5;
  // To the left
  /*
  for (var i = 0; i < pixelsNew.length; i++) {
    if (i % (w*4) < (w-pxShift)*4) {
      if ((i+1)%4 == 0) {
        pixelsNew[i] = pixelsNew[i+pxShift*4] * alphFact;
      }
      else {
        pixelsNew[i] = pixelsNew[i+pxShift*4];
      }
    }
    else {
      pixelsNew[i] = 0;
    }
  }
*/
  // To the bottom
  for (var i = pixelsNew.length; i > 0; i--) {
    if (i > (4 * pxShift * w)) {
      if ((i+1)%4 == 0) {
        pixelsNew[i] = pixelsNew[i-pxShift*4*w] * alphFact;
      }
      else {
        pixelsNew[i] = pixelsNew[i-pxShift*4*w];
      }
    }
    else {
      pixelsNew[i] = 0;
    }
  }

  /*
  // To the top
  for (var i = 0; i < pixelsNew.length; i++) {
    if (i < (pixelsNew.length - 4 * pxShift * w)) {
      if ((i+1)%4 == 0) {
        pixelsNew[i] = pixelsNew[i+pxShift*4*w] * alphFact;
      }
      else {
        pixelsNew[i] = pixelsNew[i+pxShift*4*w];
      }
    }
    else {
      pixelsNew[i] = 0;
    }
  }
*/


  graphics.updatePixels();
  
  // Get rid of oldest entry
  gridHist.shift();
  // Append dummy for new entry
  gridHist.push([])
  range(nrPointsX).forEach(i => {
    gridHist[histLen-1].push([]);
    range(nrPointsY).forEach(j => {
      gridHist[histLen-1][i][j] = 0;
    });
  });

  // Draw image
  image(capture, 0, 0, w, h);
  
  // Get pixel information
  img = capture.get();
  img.loadPixels();

  // Get average values of current img at the grid points
  range(nrPointsX).forEach(i => {
    range(nrPointsY).forEach(j => {
      avgGridNew[i][j] = getAverage(img.pixels, i, j);
    });
  });

  // Draw an ellipse at each grid point where the new avg value differs stronger from the previous one than the threshold
  fill(255);
  range(nrPointsX).forEach(i => {
    range(nrPointsY).forEach(j => {
      if (dist(...avgGridOld[i][j], ...avgGridNew[i][j]) > threshold){
        gridHist[histLen - 1][i][j] = 1;
        //ellipse(i * stepX + stepX/2, j * stepY + stepY/2, 5, 5);
      }
      avgGridOld[i][j] = avgGridNew[i][j];
    });
  });
  

  ellipseAlpha = 250;
  graphics.fill(0, 255, 65, ellipseAlpha);
  graphics.textSize(20)
  const matrixCharacters = ['ﾊ','ﾐ','ﾋ','ｰ','ｳ','ｼ','ﾅ','ﾓ','ﾆ','ｻ','ﾜ','ﾂ','ｵ','ﾘ','ｱ','ﾎ','ﾃ','ﾏ','ｹ','ﾒ','ｴ','ｶ','ｷ','ﾑ','ﾕ','ﾗ','ｾ','ﾈ','ｽ','ﾀ','ﾇ','ﾍ'];
  range(nrPointsX).forEach(i => {
    //graphics.fill(255 * i/(nrPointsX-1), 255, 255, ellipseAlpha);
    range(nrPointsY).forEach(j => {
      if (gridHist[histLen-1][i][j] == 1) {
        graphics.text(random(matrixCharacters), (i) * stepX + stepX/2, j * stepY + stepY/2) // Math.round(random(1))
        //graphics.ellipse((i) * stepX + stepX/2, j * stepY + stepY/2, r, r);
      }
    });
  });

  /*
  graphics.loadPixels();
  pixelsNew = graphics.pixels;

  for (var i = 0; i < pixelsNew.length; i++) {
    if ((i+1)%4 == 0) {
      pixelsNew[i] = pixelsNew[i] > ellipseAlpha ? ellipseAlpha : pixelsNew[i];
    }
  }
  graphics.updatePixels();
  */

  image(graphics, 0, 0);
}
  

function touchStarted() {
  getAudioContext().resume();
}



