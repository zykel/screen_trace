let w, h, graphics, imgOld;
let imgScale = 2;
nrPointsX = 60;
nrPointsY = 36;
avgGridOld = [];
avgGridNew = [];
gridHist = [];
histLen = 30;
threshold = 5;
downsample = 4;
framerate = 30;
r = 14;

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
  graphics.clear();
  
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


  
  range(nrPointsX).forEach(i => {
    graphics.fill(255 * i/(nrPointsX-1), 255, 255, 200);
    range(nrPointsY).forEach(j => {
      if (gridHist[histLen-1][i][j] == 1) {
        graphics.ellipse((i) * stepX + stepX/2, j * stepY + stepY/2, r, r);
      }
    });
  });

  if (imgOld != null) {
    imgOld.loadPixels();
    imgOld.pixels = imgOld.pixels.map((d, i) => (i+1)%4 == 0 ? max(d-10, 0) : d);
    imgOld.updatePixels();
    graphics._renderer.blend.call(graphics.get(), imgOld, 0, 0, w, h, 0, 0, w, h, OVERLAY);
  }
  imgOld = graphics.get();
  image(graphics, 0, 0);

  //noLoop();
}
  

function touchStarted() {
  getAudioContext().resume();
}



