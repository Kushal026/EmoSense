# EmoSense: AI Emotion Analyzer

Prompt: Build "EmoSense" – AI-Based Real-Time Emotion Detection System

Project Overview

Build a complete AI-powered Emotion Detection System named EmoSense.

The application should detect human emotions from facial expressions using Deep Learning and Computer Vision. It must have a modern desktop GUI with two main modes:

Live Emotion Recognition (using webcam)

Image Emotion Detection (upload an image)

The application should be responsive, accurate, and visually appealing while keeping the interface clean and professional.

Tech Stack

Backend (Python)

Use Python for everything related to AI and computer vision.

Libraries:

 OpenCV

 MediaPipe (Face Detection)

 TensorFlow/Keras

 NumPy

 Pillow

 tkinter or CustomTkinter (preferred for GUI)

 threading

 imutils

 matplotlib (only for development/testing)

Model:

 CNN trained on FER2013 dataset

 Load pretrained model (.h5)

Project Structure

EmoSense/

│
├── assets/
│   ├── logo.png
│   ├── icons/
│   └── background.png
│
├── models/
│   └── emotion_model.h5
│
├── utils/
│   ├── camera.py
│   ├── predictor.py
│   ├── preprocess.py
│   └── face_detector.py
│
├── gui/
│   ├── home.py
│   ├── live_detection.py
│   ├── image_detection.py
│   └── widgets.py
│
├── main.py
│
└── requirements.txt

GUI Requirements

Use CustomTkinter.

Design theme:

 Dark mode

 Blue gradient accents

 Minimalistic

 Rounded buttons

 Modern fonts

 Smooth transitions

Window Size

1200 × 750

Navigation

Left Sidebar

 Home

 Live Detection

 Image Detection

 About

Main Area

Display current page content.

Home Screen

Display:

Large title

EmoSense

Subtitle

AI Powered Emotion Detection System

Below this:

Two large cards

Card 1

Live Emotion Detection

Button

Start Camera

Card 2

Image Emotion Detection

Button

Upload Image

Bottom:

Status

Model Loaded Successfully

Live Emotion Recognition

This is the most important feature.

Requirements

When user clicks

Start Camera

Python should

Open webcam.

Access webcam properly.

Use OpenCV.

Run at 25–30 FPS whenever possible depending on hardware.

Do NOT freeze the GUI.

Use multithreading.

Display live video inside the GUI (not in an external OpenCV window).

Face Detection

Use

MediaPipe Face Detection

or

Haar Cascade

Prefer MediaPipe.

Detect every visible face.

Draw a smooth rectangle.

Emotion Detection

For each detected face

Predict emotion.

Supported emotions:

 Happy

 Sad

 Angry

 Fear

 Surprise

 Neutral

 Disgust

Display

😊 Happy
Confidence: 96%

Above face.

Bounding box color should depend on emotion.

Example

Happy

Green

Sad

Blue

Angry

Red

Neutral

Gray

etc.

FPS Counter

Top-left corner

Show

FPS : 29

Update every frame.

Camera Controls

Buttons

Start

Pause

Resume

Stop

Switch Camera (if multiple webcams exist)

Live Statistics Panel

Right side panel

Show

Current Emotion

Confidence

Frames Processed

Current FPS

Camera Status

Detection Time

Image Detection

User clicks

Upload Image

Open file explorer.

Supported

jpg

jpeg

png

After upload

Display image.

Detect faces.

Predict emotions.

Draw bounding boxes.

Show confidence.

Allow multiple faces.

Results Panel

Display

Emotion

Confidence

Number of Faces

Processing Time

Inference Time

Extra Features

History

Maintain recent detections.

Recent uploaded images.

Export Result

Save image with predictions.

Save report as

PNG

or

PDF.

Error Handling

If no face detected

Show

No face detected.

If webcam unavailable

Show

Camera not found.

If model missing

Show

Emotion model could not be loaded.

Never crash.

Performance

Camera should never lag.

Prediction should happen continuously.

GUI must remain responsive.

Use background threads.

Release webcam properly when exiting.

Optimize image preprocessing for low latency.

Model Requirements

Use FER2013 compatible model.

Input

48 × 48 grayscale

Normalize input.

Predict using TensorFlow.

Show top prediction.

Confidence percentage.

Coding Standards

Write clean, modular code.

Separate:

GUI

Model loading

Prediction

Camera handling

Face detection

Utility functions

Use comments.

Follow OOP where appropriate.

Avoid duplicated code.

Deliverables

Build a fully functional Python application named EmoSense that includes:

 Modern CustomTkinter GUI

 Live webcam emotion recognition

 Image upload emotion recognition

 MediaPipe face detection

 TensorFlow CNN emotion prediction

 Real-time FPS display

 Multi-threaded webcam processing

 Detection statistics panel

 Error handling

 Export prediction results

 Well-organized project structure

 Fully commented, production-quality code

The final application should feel polished, responsive, and suitable for showcasing in a portfolio, hackathon, or final-year academic project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf08fa19-87bf-480c-8a90-e64c5dc3711e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
