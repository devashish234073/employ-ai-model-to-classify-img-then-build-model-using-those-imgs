# employ-ai-model-to-classify-img-then-build-model-using-those-imgs

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

Video showing this usage: https://www.youtube.com/watch?v=RRHMGVVn0Xs

Next will have to generate images in different lightning conditions and will have to train new model using those images
