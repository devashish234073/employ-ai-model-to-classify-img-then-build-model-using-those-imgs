# train-using-trained-model

Saving image every few frames with the label whether hand is present or not and whether index finger is up or not.

For getting hand and coordinates of points making up the finger using mediapipe library and for checking if a finger is up or not added a basic function that check if the y coordinates of all teh points that makes up a finger is sorted in a particular order or not.

const fingerIndexes = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12], [0, 13, 14, 15, 16], [0, 17, 18, 19, 20]];//0th index is thumb
            function checkIfFingerIsUp(fingerIndex, landmarks) {
                let fingerIndxs = fingerIndexes[fingerIndex];
                for (let indx = 1; indx < fingerIndxs.length; indx++) {
                    let i1 = fingerIndxs[indx];
                    let i0 = fingerIndxs[indx - 1];
                    if (landmarks[i1].y > landmarks[i0].y) {
                        return false;
                    }
                }
                return true;
            }

The 1_0 in the file name means hand is there but index finger is down
The 0_0 in finger means hand is not there and index finger is definitely not up
The 1_1 indicates hand is there and index finger is up
0_1 is an invalid classification

Video showing this usage: https://www.youtube.com/watch?v=RRHMGVVn0Xs

With 500+ images its getting killed in my personal laptop:

![image](https://github.com/devashish234073/train-using-trained-model/assets/20777854/89d788a4-250e-4231-921f-cb13132ec148)

With 320 images training completed in my system but the result was not satisfactory as the accuracy was 0:

![image](https://github.com/devashish234073/train-using-trained-model/assets/20777854/2895a411-569d-44e3-bd5a-3b75195aaeee)



To train the model first run the html and keep hand in from of webcam generate 200 images copy them to images folder in the same directory as the html.

then run npm install 
then run node server.js

new model will be created and saved in saved_models directory and test set of images will be tested against that.
