document.addEventListener("DOMContentLoaded", () => {
    // ---- Configuration Settings ----
    // Your Cloudinary secure credentials for instant unsigned uploads. 
    // Secure client-side hashing keeps this self-contained. 
    const CLOUD_NAME = "dpe0knch4";
    const API_KEY = "254212931158241";
    const API_SECRET = "2qzIMv9h4mPlAfZFIBFy_rKSRjk";
    const FOLDER_NAME = "PixDrop";
    
    // ---- DOM Elements ----
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    
    const unselectedState = document.getElementById("unselected-state");
    const selectedState = document.getElementById("selected-state");
    const previewImg = document.getElementById("preview-img");
    const fileNameDisplay = document.getElementById("file-name-display");
    const removeBtn = document.getElementById("remove-btn");
    
    const uploadBtnContainer = document.getElementById("upload-btn-container");
    const uploadBtn = document.getElementById("upload-btn");
    const uploadBtnText = document.getElementById("upload-btn-text");
    const uploadProgressBar = document.getElementById("upload-progress-bar");
    const uploadProgressText = document.getElementById("upload-progress-text");
    const optimizationContainer = document.getElementById("optimization-container");
    const optimizeCheckbox = document.getElementById("optimize-checkbox");
    
    const errorContainer = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");
    
    const uploadStage = document.getElementById("upload-stage");
    const successStage = document.getElementById("success-stage");
    
    const resultImg = document.getElementById("result-img");
    const resultUrl = document.getElementById("result-url");
    const copyBtn = document.getElementById("copy-btn");
    const copyText = document.getElementById("copy-text");
    const resetBtn = document.getElementById("reset-btn");
    const verifyLink = document.getElementById("verify-link");

    const downloadQrBtn = document.getElementById("download-qr-btn");
    const printQrBtn = document.getElementById("print-qr-btn");
    const qrCanvas = document.getElementById("qr-canvas");

    let currentMode = 'image'; // 'image' or 'video'
    const tabImage = document.getElementById("tab-image");
    const tabVideo = document.getElementById("tab-video");
    const uploadTypeText = document.getElementById("upload-type-text");
    const previewVid = document.getElementById("preview-vid");
    const resultVid = document.getElementById("result-vid");
    const successHeader = document.getElementById("success-header");

    const historySection = document.getElementById("history-section");
    const historyTableBody = document.getElementById("history-table-body");
    const downloadCsvBtn = document.getElementById("download-csv-btn");
    const sessionHistory = [];

    let selectedFile = null;

    // ---- Tab Switching Logic ----
    function switchTab(mode) {
        if (currentMode === mode) return;
        currentMode = mode;
        resetToStart();
        
        if (mode === 'image') {
            tabImage.classList.add('bg-slate-100', 'text-slate-900');
            tabImage.classList.remove('text-slate-500', 'hover:text-slate-700');
            
            tabVideo.classList.remove('bg-slate-100', 'text-slate-900');
            tabVideo.classList.add('text-slate-500', 'hover:text-slate-700');
            
            fileInput.accept = "image/*";
            uploadTypeText.textContent = "Drag & Drop your image here";
            
            previewImg.classList.remove('hidden');
            previewVid.classList.add('hidden');
            
            if (optimizationContainer) optimizationContainer.classList.remove('hidden');
            
            resultImg.classList.remove('hidden');
            resultVid.classList.add('hidden');
            
            successHeader.textContent = "Image Asset Uploaded Successfully!";
        } else {
            tabVideo.classList.add('bg-slate-100', 'text-slate-900');
            tabVideo.classList.remove('text-slate-500', 'hover:text-slate-700');
            
            tabImage.classList.remove('bg-slate-100', 'text-slate-900');
            tabImage.classList.add('text-slate-500', 'hover:text-slate-700');
            
            fileInput.accept = "video/*";
            uploadTypeText.textContent = "Drag & Drop your video here";
            
            previewImg.classList.add('hidden');
            previewVid.classList.remove('hidden');
            
            if (optimizationContainer) optimizationContainer.classList.add('hidden');
            
            resultImg.classList.add('hidden');
            resultVid.classList.remove('hidden');
            
            successHeader.textContent = "Video Asset Uploaded Successfully!";
        }
    }
    
    if (tabImage) tabImage.addEventListener('click', () => switchTab('image'));
    if (tabVideo) tabVideo.addEventListener('click', () => switchTab('video'));

    // ---- Drag and Drop Core Logic ----
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Attach preventDefaults dynamically
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            if(!selectedFile) {
                dropZone.classList.add('border-orange-500', 'bg-orange-50');
            }
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-orange-500', 'bg-orange-50');
        });
    });

    // Handle when a file is physically dropped
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            handleFile(dt.files[0]);
        }
    });

    // Handle system file browser selection
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    // Cancel selection
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Avoid re-triggering file input selector
        resetUploadStage();
    });

    // Start all over again
    resetBtn.addEventListener('click', () => {
        resetToStart();
    });

    // Copy to Clipboard feature for URLs
    copyBtn.addEventListener('click', () => {
        const urlToCopy = resultUrl.value;
        if (urlToCopy) {
            navigator.clipboard.writeText(urlToCopy).then(() => {
                // Success visual state
                copyBtn.classList.remove('bg-slate-100', 'text-slate-700');
                copyBtn.classList.add('bg-emerald-600', 'text-white');
                copyText.innerText = "Copied!";
                
                // Return to previous visual state
                setTimeout(() => {
                    copyBtn.classList.remove('bg-emerald-600', 'text-white');
                    copyBtn.classList.add('bg-slate-100', 'text-slate-700');
                    copyText.innerText = "Copy URL";
                }, 2000);
            }).catch(err => {
                console.error("Clipboard writing error:", err);
            });
        }
    });

    // QR Code Actions
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', () => {
            if (qrCanvas) {
                const url = qrCanvas.toDataURL("image/png");
                const a = document.createElement('a');
                a.href = url;
                a.download = "qrcode.png";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    if (printQrBtn) {
        printQrBtn.addEventListener('click', () => {
            if (qrCanvas) {
                const url = qrCanvas.toDataURL("image/png");
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head><title>Print QR Code</title></head>
                            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
                                <img src="${url}" style="width:160px;height:160px;" />
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 250);
                }
            }
        });
    }

    // ---- Support / Payment Section ----
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountBtn = document.getElementById('custom-amount-btn');
    const customAmountContainer = document.getElementById('custom-amount-container');
    const customAmountInput = document.getElementById('custom-amount-input');
    const supportContinueBtn = document.getElementById('support-continue-btn');
    const upiQrContainer = document.getElementById('upi-qr-container');
    const upiQrCanvas = document.getElementById('upi-qr-canvas');
    const upiDeepLink = document.getElementById('upi-deep-link');

    let selectedSupportAmount = 0;

    function resetAmountStyles() {
        amountBtns.forEach(btn => {
            btn.classList.remove('border-orange-500', 'bg-orange-50', 'text-orange-700');
            btn.classList.add('border-transparent', 'bg-slate-100', 'text-slate-700');
        });
        if (customAmountBtn) {
            customAmountBtn.classList.remove('border-orange-500', 'bg-orange-50', 'text-orange-700');
            customAmountBtn.classList.add('border-transparent', 'bg-slate-100', 'text-slate-700');
        }
        if (upiQrContainer) {
            upiQrContainer.classList.add('hidden');
            upiQrContainer.classList.remove('flex');
        }
    }

    if (amountBtns) {
        amountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                resetAmountStyles();
                btn.classList.remove('border-transparent', 'bg-slate-100', 'text-slate-700');
                btn.classList.add('border-orange-500', 'bg-orange-50', 'text-orange-700');
                selectedSupportAmount = parseInt(btn.dataset.amount, 10);
                if (customAmountContainer) customAmountContainer.classList.add('hidden');
                if (supportContinueBtn) {
                    supportContinueBtn.classList.remove('hidden');
                    supportContinueBtn.classList.add('block');
                }
            });
        });
    }

    if (customAmountBtn) {
        customAmountBtn.addEventListener('click', () => {
            resetAmountStyles();
            customAmountBtn.classList.remove('border-transparent', 'bg-slate-100', 'text-slate-700');
            customAmountBtn.classList.add('border-orange-500', 'bg-orange-50', 'text-orange-700');
            if (customAmountInput) {
                selectedSupportAmount = parseInt(customAmountInput.value, 10) || 0;
            } else {
                selectedSupportAmount = 0;
            }
            if (customAmountContainer) customAmountContainer.classList.remove('hidden');
            if (supportContinueBtn) {
                supportContinueBtn.classList.remove('hidden');
                supportContinueBtn.classList.add('block');
            }
        });
    }

    if (customAmountInput) {
        customAmountInput.addEventListener('input', (e) => {
            selectedSupportAmount = parseInt(e.target.value, 10) || 0;
        });
    }

    if (supportContinueBtn) {
        supportContinueBtn.addEventListener('click', () => {
            if (selectedSupportAmount <= 0) {
                alert("Please select or enter a valid amount.");
                return;
            }
            
            // Generate UPI Intent URL
            const upiId = "abhishek8324@fam";
            const upiName = encodeURIComponent("Abhishek Kumar");
            const upiUrl = `upi://pay?pa=${upiId}&pn=${upiName}&am=${selectedSupportAmount}&cu=INR`;
            
            // Set deep link
            if (upiDeepLink) {
                upiDeepLink.href = upiUrl;
            }

            // Attempt automatic deep-link redirect on mobile devices
            const isMobile = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                window.location.href = upiUrl;
            } else {
                // Generate QR only for non-mobile devices (PC, tablet, etc.)
                if (typeof QRious !== 'undefined' && upiQrCanvas) {
                    new QRious({
                        element: upiQrCanvas,
                        value: upiUrl,
                        size: 180,
                        background: 'white',
                        foreground: '#ea580c' // Tailwind orange-600
                    });
                }

                if (upiQrContainer) {
                    upiQrContainer.classList.remove('hidden');
                    upiQrContainer.classList.add('flex');
                }
            }
        });
    }

    // ---- Utility Methods ----

    function handleFile(file) {
        if (currentMode === 'image') {
            if (file.type && !file.type.startsWith('image/')) {
                showError("Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).");
                return;
            }
        } else {
            if (file.type && !file.type.startsWith('video/')) {
                showError("Please select a valid video file (MP4, WEBM, MOV, etc.).");
                return;
            }
        }

        const maxSize = currentMode === 'video' ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
        if (file.size > maxSize) {
            showError(`Selected ${currentMode} is too large. The maximum system limit allows ${currentMode === 'video' ? '100MB' : '15MB'}.`);
            return;
        }

        hideError();
        selectedFile = file;
        fileNameDisplay.textContent = file.name || `Uploaded ${currentMode === 'image' ? 'Image' : 'Video'}`;

        const fileUrl = URL.createObjectURL(file);
        if (currentMode === 'image') {
            previewImg.src = fileUrl;
        } else {
            previewVid.src = fileUrl;
        }
        showSelectedState();
    }

    function showSelectedState() {
        dropZone.classList.remove('hover:border-orange-400', 'hover:bg-slate-50', 'border-dashed');
        dropZone.classList.add('border-solid', 'cursor-default');
        
        fileInput.classList.add('hidden');
        fileInput.classList.remove('z-10');
        fileInput.classList.add('-z-10'); // Move to background
        
        unselectedState.classList.add('hidden');
        unselectedState.classList.remove('flex'); // Essential for Tailwind
        
        selectedState.classList.remove('hidden');
        selectedState.classList.add('flex');
        
        uploadBtnContainer.classList.remove('hidden');
    }

    function resetUploadStage() {
        selectedFile = null;
        fileInput.value = ""; 
        fileNameDisplay.textContent = "";
        previewImg.removeAttribute("src");
        previewVid.removeAttribute("src");
        
        dropZone.classList.add('hover:border-orange-400', 'hover:bg-slate-50', 'border-dashed');
        dropZone.classList.remove('border-solid', 'cursor-default');
        
        fileInput.classList.remove('hidden');
        fileInput.classList.remove('-z-10');
        fileInput.classList.add('z-10'); // Restore interaction
        
        selectedState.classList.add('hidden');
        selectedState.classList.remove('flex');
        
        unselectedState.classList.remove('hidden');
        unselectedState.classList.add('flex');
        
        uploadBtnContainer.classList.add('hidden');
        hideError();
    }

    function resetToStart() {
        uploadStage.classList.remove('hidden');
        successStage.classList.add('hidden');
        resetUploadStage();
    }

    function showError(msg) {
        errorText.innerText = msg;
        errorContainer.classList.remove('hidden');
        errorContainer.classList.add('flex');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
        errorContainer.classList.remove('flex');
    }

    function setUploadingState(isUploading) {
        uploadBtn.disabled = isUploading;
        
        // Dynamically fetch elements to avoid detach issues with Lucide
        const uIcon = document.getElementById("upload-icon");
        const uSpinner = document.getElementById("upload-spinner");
        
        if (isUploading) {
            uploadBtn.classList.add('opacity-75', 'cursor-not-allowed');
            if (uIcon) uIcon.classList.add('hidden');
            if (uSpinner) uSpinner.classList.remove('hidden');
            uploadBtnText.textContent = "Uploading...";
            if (uploadProgressText) {
                uploadProgressText.classList.remove('hidden');
                uploadProgressText.textContent = "0%";
            }
            if (uploadProgressBar) {
                uploadProgressBar.style.width = "0%";
            }
        } else {
            uploadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            if (uIcon) uIcon.classList.remove('hidden');
            if (uSpinner) uSpinner.classList.add('hidden');
            uploadBtnText.textContent = "Upload and Get Public Direct Link";
            if (uploadProgressText) uploadProgressText.classList.add('hidden');
            if (uploadProgressBar) uploadProgressBar.style.width = "0%";
        }
    }

    // ---- Optimization Security & Processing ----
    
    async function optimizeImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(optimizedFile);
                    } else {
                        reject(new Error("Canvas to Blob conversion failed"));
                    }
                }, 'image/webp', 0.85); // 85% quality WebP
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Image load failed for optimization"));
            };
            img.src = url;
        });
    }

    // Generates a SHA-1 Signature mimicking server-side Cloudinary logic
    async function generateSignature(timestamp, apiSecret) {
        // String format mandated by Cloudinary
        const text = `folder=${FOLDER_NAME}&timestamp=${timestamp}${apiSecret}`;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        // SHA-1 is completely sufficient and requested by cloudinary backend
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Array mapping transforms digest to hexadecimal format
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // ---- Upload Action Pipeline ----
    
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        setUploadingState(true);
        hideError();

        try {
            let finalFileToUpload = selectedFile;
            
            if (currentMode === 'image' && optimizeCheckbox && optimizeCheckbox.checked) {
                try {
                    finalFileToUpload = await optimizeImage(selectedFile);
                } catch (optErr) {
                    console.warn("Optimization failed, falling back to original file.", optErr);
                }
            }

            // Setup timestamp
            const timestamp = Math.floor(Date.now() / 1000);
            
            // Build crypto signature instantly in browser bypassing node usage
            const signature = await generateSignature(timestamp, API_SECRET);

            // Structure boundary
            const formData = new FormData();
            formData.append("file", finalFileToUpload);
            formData.append("api_key", API_KEY);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);
            formData.append("folder", FOLDER_NAME);

            // XHR Upload with Progress
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${currentMode}/upload`, true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    if (uploadProgressBar) uploadProgressBar.style.width = percentComplete + '%';
                    if (uploadProgressText) uploadProgressText.textContent = percentComplete + '%';
                }
            };

            xhr.onload = () => {
                setUploadingState(false);
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Move panels around smoothly using Tailwind utilities mapping
                        uploadStage.classList.add('hidden');
                        successStage.classList.remove('hidden');
                        
                        // Re-mount attributes on DOM objects
                        if (currentMode === 'image') {
                            resultImg.src = data.secure_url;
                        } else {
                            resultVid.src = data.secure_url;
                        }
                        resultUrl.value = data.secure_url;
                        verifyLink.href = data.secure_url;

                        // Generate QR Code
                        if (typeof QRious !== 'undefined') {
                            new QRious({
                                element: document.getElementById('qr-canvas'),
                                value: data.secure_url,
                                size: 160,
                                background: 'white',
                                foreground: '#0f172a' // slate-900
                            });
                        } else {
                            console.error("QRious library not loaded.");
                        }

                        // Add to History
                        addFileToHistory(selectedFile.name, data.secure_url);
                        
                    } else {
                        throw new Error(data.error?.message || `Failed to upload ${currentMode}. Please verify your credentials if the issue persists.`);
                    }
                } catch (err) {
                    showError("Upload Error: " + err.message);
                }
            };

            xhr.onerror = () => {
                setUploadingState(false);
                showError("Network Upload Error. Please check your connection.");
            };

            xhr.send(formData);

        } catch (err) {
            showError("Pre-flight Error: " + err.message);
            setUploadingState(false);
        }
    });

    // ---- History & CSV Functions ----

    function addFileToHistory(fileName, fileUrl) {
        sessionHistory.push({ fileName, fileUrl });
        
        if (historySection) historySection.classList.remove('hidden');
        
        if (historyTableBody) {
            const tr = document.createElement('tr');
            
            const tdName = document.createElement('td');
            tdName.className = "px-4 py-3 border-b border-slate-100 max-w-[150px] sm:max-w-[200px] truncate";
            tdName.title = fileName;
            tdName.textContent = fileName;
            
            const tdUrl = document.createElement('td');
            tdUrl.className = "px-4 py-3 border-b border-slate-100";
            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = "_blank";
            link.className = "text-orange-600 hover:text-orange-700 underline truncate block max-w-[150px] sm:max-w-[300px]";
            link.title = fileUrl;
            link.textContent = fileUrl;
            
            tdUrl.appendChild(link);
            tr.appendChild(tdName);
            tr.appendChild(tdUrl);
            
            historyTableBody.appendChild(tr);
        }
    }

    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', () => {
            if (sessionHistory.length === 0) return;
            
            // Build CSV Content
            let csvContent = "File Name,URL\n";
            sessionHistory.forEach(item => {
                // Escape quotes
                const safeName = item.fileName.replace(/"/g, '""');
                const safeUrl = item.fileUrl.replace(/"/g, '""');
                csvContent += `"${safeName}","${safeUrl}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "PixDrop_Session_History.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

});
