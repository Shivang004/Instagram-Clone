'use client';

import { useState, useRef, useEffect } from 'react';
import { usePostsStore } from '../../lib/store/postsStore';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './CreatePostModal.module.css';

const CreatePostModal = ({ onClose }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'crop', 'caption'
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Crop state
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    aspect: 1 / 1, // Square crop by default
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showEmojis, setShowEmojis] = useState(false);
  const emojis = ['😀', '😍', '👍', '❤️', '🔥', '😂', '👏', '🎉'];
  const addPost = usePostsStore(state => state.addPost);

  // Track navigation history for browser back button support
  const [navigationHistory, setNavigationHistory] = useState(['upload']);
  const isHandlingPopState = useRef(false);

  // Initialize and cleanup camera stream
  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup history state handling for browser back button
  useEffect(() => {
    // Add a state to history when modal opens
    window.history.pushState({ modalStep: 'upload' }, '');

    // Listen for popstate events (when user clicks browser back button)
    const handlePopState = () => {
      if (isHandlingPopState.current) return;
      isHandlingPopState.current = true;

      // Get the previous step from our navigation history
      if (navigationHistory.length > 1) {
        // Remove current step from history
        const newHistory = [...navigationHistory];
        newHistory.pop();
        setNavigationHistory(newHistory);

        // Go to previous step
        const prevStep = newHistory[newHistory.length - 1];

        if (prevStep === 'upload') {
          setStep('upload');
          setShowCrop(false);
          if (cameraActive) {
            stopCamera();
          }
        } else if (prevStep === 'preview') {
          setStep('preview');
          setShowCrop(false);
        } else if (prevStep === 'crop') {
          setStep('preview');
          setShowCrop(true);
        }
      } else {
        // If we're at the first step, close the modal
        onClose();
      }

      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigationHistory, onClose, cameraActive]);

  // Track step changes and update browser history
  useEffect(() => {
    if (isHandlingPopState.current) return;

    // When step changes, add to navigation history and push to browser history
    let currentState = step;
    if (step === 'preview' && showCrop) {
      currentState = 'crop';
    }

    // Check if we're actually changing state
    if (navigationHistory[navigationHistory.length - 1] !== currentState) {
      setNavigationHistory(prev => [...prev, currentState]);
      window.history.pushState({ modalStep: currentState }, '');
    }
  }, [step, showCrop, navigationHistory]);

  // Setup drag and drop event listeners
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone || step !== 'upload') return;

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageUrl(e.target.result);
            setStep('preview');
          };
          reader.readAsDataURL(file);
        } else {
          setError('Please drop an image file');
        }
      }
    };

    // Add event listeners to the entire modal to capture drag events
    const modal = document.querySelector(`.${styles.modal}`);

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Also handle drag events on the whole modal to prevent opening in new tab
    if (modal) {
      modal.addEventListener('dragover', (e) => e.preventDefault());
      modal.addEventListener('drop', (e) => e.preventDefault());
    }

    // Cleanup
    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);

      if (modal) {
        modal.removeEventListener('dragover', (e) => e.preventDefault());
        modal.removeEventListener('drop', (e) => e.preventDefault());
      }
    };
  }, [step]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      // Create a new image element with proper CORS attributes
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Draw the image to a canvas to create a CORS-safe data URL
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        try {
          // Create a CORS-safe data URL
          const dataUrl = canvas.toDataURL("image/jpeg");
          setImageUrl(dataUrl);
          setStep('preview');
        } catch (err) {
          console.error("CORS error:", err);
          setError("This image cannot be loaded due to security restrictions. Try downloading it first or use an image from your device.");
        }
      };

      img.onerror = () => {
        setError("Failed to load the image. Check the URL or try another image.");
      };

      img.src = imageUrl;
    } else {
      setError('Please enter a valid URL');
    }
  };
  const startCameraCapture = async () => {
    try {
      setCameraActive(true);

      // Small delay to ensure the video element is in the DOM
      setTimeout(async () => {
        if (!videoRef.current) {
          setError('Camera initialization failed');
          setCameraActive(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Error playing video:', err);
          setError('Could not start video stream');
          setCameraActive(false);
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Error accessing camera:', err);
      setCameraActive(false);
    }
  };

  const takePicture = () => {
    if (!videoRef.current) {
      setError('Camera not initialized');
      return;
    }

    if (!videoRef.current.videoWidth) {
      setError('Camera stream not ready yet');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setImageUrl(imageDataUrl);

    // Stop the camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setStep('preview');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Function to generate cropped image that respects aspect ratio
  const getCroppedImg = () => {
    if (!imgRef.current || !completedCrop) {
      setError('Please select an area to crop first');
      return null;
    }

    if (!completedCrop.width || !completedCrop.height) {
      setError('Invalid crop selection');
      return null;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    const ctx = canvas.getContext('2d');

    try {
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      return canvas.toDataURL('image/jpeg');
    } catch (err) {
      console.error('Canvas error:', err);
      setError('Cannot process this image due to security restrictions. Try uploading from your device instead.');
      return null;
    }
  };
  const handleStartCrop = () => {
    setShowCrop(true);

    // Apply the current aspect ratio setting to the crop
    let aspect = null;
    if (aspectRatio === '1:1') aspect = 1;
    else if (aspectRatio === '4:5') aspect = 4 / 5;
    else if (aspectRatio === '16:9') aspect = 16 / 9;

    // For the initial crop, we'll create a centered crop with proper aspect ratio
    // Set dimensions based on image size for better initial placement
    if (imgRef.current) {
      const imageWidth = imgRef.current.width;
      const imageHeight = imgRef.current.height;

      // Default to 80% of the smaller dimension to ensure crop fits in image
      const maxSize = Math.min(imageWidth, imageHeight) * 0.8;

      let cropWidth, cropHeight;

      if (aspect) {
        if (aspect === 1) {
          // Square crop (1:1)
          cropWidth = maxSize;
          cropHeight = maxSize;
        } else if (aspect < 1) {
          // Portrait crop (e.g., 4:5)
          cropHeight = maxSize;
          cropWidth = maxSize * aspect;
        } else {
          // Landscape crop (e.g., 16:9)
          cropWidth = maxSize;
          cropHeight = maxSize / aspect;
        }

        // Convert to percentages
        const widthPercent = (cropWidth / imageWidth) * 100;
        const heightPercent = (cropHeight / imageHeight) * 100;

        // Center the crop
        const x = (imageWidth - cropWidth) / 2 / imageWidth * 100;
        const y = (imageHeight - cropHeight) / 2 / imageHeight * 100;

        setCrop({
          unit: '%',
          width: widthPercent,
          height: heightPercent,
          x: x,
          y: y,
          aspect: aspect
        });
      } else {
        // Free aspect ratio - default to square but without constraint
        const widthPercent = 80;
        const heightPercent = 80;

        setCrop({
          unit: '%',
          width: widthPercent,
          height: heightPercent,
          x: 10,
          y: 10,
          aspect: null
        });
      }
    } else {
      // Fallback if image ref isn't available
      if (aspect === 1) {
        setCrop({
          unit: '%',
          width: 80,
          height: 80,
          x: 10,
          y: 10,
          aspect: aspect
        });
      } else if (aspect) {
        setCrop({
          unit: '%',
          width: 80,
          height: 80 / aspect,
          x: 10,
          y: 10,
          aspect: aspect
        });
      } else {
        setCrop({
          unit: '%',
          width: 80,
          height: 80,
          x: 10,
          y: 10,
          aspect: null
        });
      }
    }

    // Clear any previous completed crop
    setCompletedCrop(null);
  };
  const handleCompleteCrop = () => {
    const croppedImage = getCroppedImg();
    if (croppedImage) {
      setCroppedImageUrl(croppedImage);
      setShowCrop(false);
      setStep('caption');
    }
    // Error is already set in getCroppedImg if there's an issue
  };
  const handleAspectRatioChange = (value) => {
    setAspectRatio(value);

    let aspect = null;
    if (value === '1:1') aspect = 1;
    else if (value === '4:5') aspect = 4 / 5;
    else if (value === '16:9') aspect = 16 / 9;

    // If image reference is available, use it to calculate appropriate dimensions
    if (imgRef.current) {
      // Reference the current crop to maintain position
      const currentCrop = { ...crop };

      // For square crop, make sure width equals height
      if (aspect === 1) {
        // Use the smaller of current width/height for the square
        const size = Math.min(currentCrop.width, currentCrop.height);

        setCrop({
          ...currentCrop,
          width: size,
          height: size,
          aspect: aspect
        });
      }
      // For other aspect ratios, maintain center position but adjust dimensions
      else if (aspect) {
        // Get current center point
        const centerX = currentCrop.x + (currentCrop.width / 2);
        const centerY = currentCrop.y + (currentCrop.height / 2);

        // Start with current width and calculate new height
        const newHeight = currentCrop.width / aspect;

        // Check if new height would exceed image bounds
        if (newHeight > 95) {
          // Height would be too large, so adjust width instead
          const newWidth = 95 * aspect;

          // Calculate new x,y to maintain center position
          const newX = Math.max(0, centerX - (newWidth / 2));
          const newY = Math.max(0, centerY - (95 / 2));

          setCrop({
            unit: '%',
            width: newWidth,
            height: 95,
            x: newX,
            y: newY,
            aspect: aspect
          });
        } else {
          // New height is fine, calculate new x,y to maintain center
          const newX = Math.max(0, centerX - (currentCrop.width / 2));
          const newY = Math.max(0, centerY - (newHeight / 2));

          setCrop({
            unit: '%',
            width: currentCrop.width,
            height: newHeight,
            x: newX,
            y: newY,
            aspect: aspect
          });
        }
      }
      // For free aspect ratio
      else {
        setCrop({
          ...currentCrop,
          aspect: null
        });
      }
    }
    // Fallback if image ref isn't available
    else {
      setCrop(prev => {
        if (aspect === 1) {
          // For square, make height equal to width
          return {
            ...prev,
            height: prev.width,
            aspect: aspect
          };
        } else if (aspect) {
          // For other fixed aspects, adjust height based on width
          return {
            ...prev,
            height: prev.width / aspect,
            aspect: aspect
          };
        } else {
          // For free aspect, just remove the aspect constraint
          return {
            ...prev,
            aspect: null
          };
        }
      });
    }
  };


  const handleCancelCrop = () => {
    // Manually trigger browser back functionality
    window.history.back();
  };

  const handleReCrop = () => {
    setStep('preview');
    setShowCrop(true);

    // Apply the current aspect ratio
    let aspect = null;
    if (aspectRatio === '1:1') aspect = 1;
    else if (aspectRatio === '4:5') aspect = 4 / 5;
    else if (aspectRatio === '16:9') aspect = 16 / 9;

    setCrop({
      unit: '%',
      width: 80,
      height: aspect ? 80 / aspect : 80,
      aspect: aspect
    });

    // Reset any error
    setError('');
  };

  const handleCreatePost = () => {
    const imageToUse = croppedImageUrl || imageUrl;
    const newPost = {
      id: Date.now().toString(),
      imageUrl: imageToUse,
      caption,
      username: 'user123',
      timestamp: new Date().toISOString(),
      likes: 0
    };

    addPost(newPost);

    // Clean up history before closing modal
    // This prevents browser history from being cluttered with modal states
    for (let i = 0; i < navigationHistory.length; i++) {
      window.history.back();
    }

    // Short timeout to allow history operations to complete
    setTimeout(() => {
      onClose();
    }, 10);
  };

  const handleBackClick = () => {
    // Use browser history back button instead of manually managing state
    window.history.back();
  };

  const moveToCaption = () => {
    setStep('caption');
  };

  const handleEmojiClick = (emoji) => {
    setCaption((prev) => prev + emoji);
    setShowEmojis(false);
  };

  // Handler for modal close that properly cleans up history
  const handleModalClose = () => {
    // Clean up history before closing modal
    // This prevents browser history from being cluttered with modal states
    for (let i = 0; i < navigationHistory.length; i++) {
      window.history.back();
    }

    // Short timeout to allow history operations to complete
    setTimeout(() => {
      onClose();
    }, 10);
  };

  // Render the content based on current step
  const renderContent = () => {
    if (step === 'upload') {
      if (cameraActive) {
        return (
          <div className={styles.cameraContent}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.cameraPreview}
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              onLoadedMetadata={() => {
                // Clear any errors once video is loaded
                setError('');
              }}
            />
            <div className={styles.cameraControls}>
              <button
                className={styles.captureButton}
                onClick={takePicture}
                disabled={!cameraActive}
              >
                <span className={styles.captureIcon}></span>
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => stopCamera()}
              >
                Cancel
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        );
      }

      return (
        <div
          className={`${styles.uploadContent} ${isDragging ? styles.dragging : ''}`}
          ref={dropZoneRef}
        >
          <svg className={styles.uploadIcon} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>Drag photos and videos here</p>
          <div className={styles.uploadButtons}>
            <button
              className={styles.fileSelectButton}
              onClick={() => fileInputRef.current.click()}
            >
              Select from Device
            </button>
            <button
              className={styles.fileSelectButton}
              onClick={startCameraCapture}
            >
              Take a photo
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className={styles.fileInput}
          />

          <div className={styles.divider}>OR</div>

          <form onSubmit={handleUrlSubmit} className={styles.urlForm}>
            <input
              type="text"
              placeholder="Paste image URL"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setError('');
              }}
              className={styles.urlInput}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={styles.fileSelectButton}
              disabled={!imageUrl.trim()}
            >
              Continue
            </button>
          </form>
        </div>
      );
    }

    if (step === 'preview') {
      if (showCrop) {
        return (
          <div className={styles.cropContent}>
            <div className={styles.cropContainer}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={crop.aspect}
                circularCrop={false}
                keepSelection={true}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  style={{ maxWidth: '100%', maxHeight: '60vh' }}
                  onLoad={() => setError('')}

                />
              </ReactCrop>
            </div>
            <div className={styles.cropControls}>
              <select
                className={styles.aspectRatioSelect}
                onChange={(e) => handleAspectRatioChange(e.target.value)}
                value={aspectRatio}
              >
                <option value="1:1">Square (1:1)</option>
                <option value="4:5">Portrait (4:5)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="free">Free</option>
              </select>
              <div className={styles.cropButtonGroup}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancelCrop}
                >
                  Cancel
                </button>
                <button
                  className={styles.applyButton}
                  onClick={handleCompleteCrop}
                >
                  Apply
                </button>
              </div>
            </div>
            {error && <p className={styles.cropError}>{error}</p>}
          </div>
        );
      }

      return (
        <div className={styles.previewContent}>
          <div className={styles.imagePreview}>
            <img
              src={croppedImageUrl || imageUrl}
              alt="Preview"
              className={styles.previewImage}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}

            />
          </div>
          <div className={styles.previewControls}>
            <button
              className={styles.nextButton}
              onClick={handleStartCrop}
            >
              Crop
            </button>
            <button
              className={styles.nextButton}
              onClick={moveToCaption}
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    if (step === 'caption') {
      return (
        <div className={styles.captionContent}>
          <div className={styles.imagePreview}>
            <img
              src={croppedImageUrl || imageUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }}
            />
          </div>
          <div className={styles.captionForm}>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={styles.captionInput}
              maxLength={2200}
            />
            <div className="absolute left-0 mt-2">
              <button
                variant="ghost"
                onClick={() => setShowEmojis(!showEmojis)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" color='grey' fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"></path><path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path><circle cx="8" cy="9" r="1.5" fill="currentColor"></circle><circle cx="16" cy="9" r="1.5" fill="currentColor"></circle></svg>
              </button>
              {showEmojis && (
                <div className="absolute bg-white border rounded shadow-md p-2 grid grid-cols-4 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-xl p-1 hover:bg-gray-200 rounded"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.captionControls}>
              <button
                className={styles.reCropButton}
                onClick={handleReCrop}
              >
                Edit Crop
              </button>
              <div className={styles.captionCounter}>
                {caption.length}/2,200
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleModalClose}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        <div className={styles.header}>
          {(step !== 'upload' || showCrop) && (
            <button className={styles.backButton} onClick={handleBackClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h2>Create New Post</h2>
          {step === 'caption' && (
            <button className={styles.shareButton} onClick={handleCreatePost}>
              Share
            </button>
          )}
          {step !== 'caption' && (
            <button className={styles.closeButton} onClick={handleModalClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;