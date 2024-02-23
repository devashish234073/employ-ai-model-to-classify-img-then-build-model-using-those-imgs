const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

const { createCanvas, loadImage } = require('canvas');


async function loadImageInner(imagePath) {
    return new Promise((resolve, reject) => {
        loadImage(imagePath).then((image) => {
            resolve(image);
        })
            .catch(error => {
                console.log("Error reading image", error);
                resolve(null);
            });
    });
}

async function readAndExtractRedChannel(imagePath) {
    const image = await loadImageInner(imagePath);
    let promise = new Promise((resolve, reject) => {
        try {
            if (image == null) {
                resolve(null);
            } else {
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const { data } = imageData;

                const redChannelValues = [];
                for (let i = 0; i < data.length; i += 4) {
                    redChannelValues.push(data[i] / 255); // Normalize pixel values
                }
                resolve(tf.tensor(redChannelValues, [canvas.height, canvas.width, 1]));
            }
        } catch (error) {
            console.error('Error loading or extracting red channel from image:', error);
            resolve(null);
        }
    });
    return promise;
}

async function getImage(imagePath) {
    let image = await readAndExtractRedChannel(imagePath);
    let promise = new Promise((resolve, reject) => {
        resolve(image);
    });
    return promise;
}

let classes = [0.0, 0.25, 0.5, 0.75];
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function loadImagesAndLabels(folderPath) {
    let filenames = fs.readdirSync(folderPath);
    filenames = shuffleArray(filenames);
    const images = [];
    const labels = [];
    for (let i = 0; i < filenames.length; i++) {
        let filename = filenames[i];
        if (filename.startsWith("img") && filename.indexOf("Zone") == -1 && filename.endsWith("_.jpg") > -1) {
            let fileNameSplit = filename.split("_");
            if (fileNameSplit.length == 4) {
                const imagePath = `${folderPath}/${filename}`;
                const image = await getImage(imagePath);
                if (image != null) {
                    images.push(image);
                    let out = classes[0];
                    if (fileNameSplit[1] == "0" && fileNameSplit[2] == "1") {
                        out = classes[1];
                    } else if (fileNameSplit[1] == "1" && fileNameSplit[2] == "0") {
                        out = classes[2];
                    } else if (fileNameSplit[1] == "1" && fileNameSplit[2] == "1") {
                        out = classes[3];
                    }
                    labels.push(out);
                }
            }
        }
    }
    return new Promise((resolve, reject) => {
        resolve({ images, labels });
    });
}

// Split dataset into training and testing
function splitDataset(images, labels, splitPercentage) {
    const splitIndex = Math.floor(images.length * splitPercentage);
    const trainingImages = images.slice(0, splitIndex);
    const testingImages = images.slice(splitIndex);
    const trainingLabels = labels.slice(0, splitIndex);
    const testingLabels = labels.slice(splitIndex);
    return { trainingImages, trainingLabels, testingImages, testingLabels };
}

// Load and preprocess data
const folderPath = "images";
loadImagesAndLabels(folderPath).then(data => {
    const { images, labels } = data;
    const splitPercentage = 0.9; // 80% for training, 20% for testing
    const { trainingImages, trainingLabels, testingImages, testingLabels } = splitDataset(images, labels, splitPercentage);

    // Define model architecture
    const model = tf.sequential();
    console.log(trainingImages[0]);
    console.log("input shape", [trainingImages[0].shape[0], trainingImages[0].shape[1], 1]);
    model.add(tf.layers.flatten({ inputShape: [trainingImages[0].shape[0], trainingImages[0].shape[1], 1] }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    let useMSE = false;
    if(!useMSE) {
        model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
        model.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });
    } else {
        model.add(tf.layers.dense({ units: 1, activation: 'softmax' }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError', metrics: ['accuracy'] });
    }

    // Train the model
    const epochs = 10;
    let promise = model.fit(tf.stack(trainingImages), tf.tensor(trainingLabels), { epochs: 10, batchSize: 32 });
    console.log("promise is", promise);
    promise.then((summary) => {
        console.log('Training summary.', summary);
        model.save('file://saved_model').then(
            () => {
                console.log('Model saved.');
                tf.loadLayersModel('file://saved_model/model.json')
                    .then(loadedModel => {
                        console.log();
                        for (let i = 0; i < testingImages.length; i++) {
                            let testingImage = testingImages[i];
                            let label = testingLabels[i];
                            const prediction = loadedModel.predict([testingImage.expandDims()]);
                            prediction.array().then((predictedVal,lala) => {
                                let maxIndx = 0;
                                for (let j = 1; j < predictedVal[0].length; j++) {
                                    if (predictedVal[0][j] > predictedVal[0][maxIndx]) {
                                        maxIndx = j;
                                    }
                                }
                                console.log("predictedVal for i=" + i + ":", predictedVal + " i.e. " + classes[maxIndx] + " while actual label was " + label);
                            });
                        }
                    })
                    .catch(err => { console.log("err while laoding model", err); });
            }
        );
    });
});

// Reuse the saved model with another image
/*const newImagePath = 'new_image.jpg';
const newImage = readAndConvertToGrayScale(newImagePath);
model.load('file://saved_model')
    .then(loadedModel => {
        const prediction = loadedModel.predict(tf.expandDims(newImage));
        const predictedLabelIndex = prediction.argMax(-1).dataSync()[0];
        const predictedLabel = labels[predictedLabelIndex];
        console.log(`Prediction for ${newImagePath}: ${predictedLabel}`);
    });*/
