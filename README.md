# PixDrop

### Fast. Simple. Shareable.

**PixDrop** is a lightweight, browser-based media uploading and optimization utility that lets users convert local images and videos into instantly shareable, cloud-hosted URLs.

Built around a clean single-screen workflow, PixDrop combines **drag-and-drop uploading, Cloudinary storage, automatic image optimization, session history, CSV export, and UPI-based creator support** into one streamlined tool.

---

## ✨ Features

### 📤 Media Uploading

PixDrop is designed to make uploading media as fast as possible.

* Drag and drop files directly into the upload area.
* Click the upload area to browse local files.
* Supports image and video uploads.
* Displays upload progress/status to the user.
* Generates a live cloud-hosted URL after successful upload.
* Shows a visual preview of the uploaded media.
* Uploads are organized inside a dedicated **`PixDrop`** Cloudinary folder.

---

### ⚡ Automatic Media Optimization

PixDrop includes an optional **Optimize** workflow for users who want smaller, web-friendly files.

When optimization is enabled:

* Image files are converted to **WebP**.
* Compression reduces unnecessary file size.
* Optimized assets remain suitable for web usage.
* The optimization process runs before the final cloud upload.
* The original file name is retained for history/documentation purposes.

This makes PixDrop useful for websites, portfolios, documentation, social media workflows, and other situations where lightweight media URLs are preferable.

> Optimization behavior depends on the media type. The WebP conversion workflow applies to images.

---

### 🔗 Instant URL Generation

After a successful upload, PixDrop immediately provides:

* Uploaded media preview
* Generated Cloudinary URL
* Original file name
* Upload status
* Easy access to the generated resource

The resulting URL can be copied and used anywhere a hosted image or video URL is supported.

Example:

```text
https://res.cloudinary.com/<cloud-name>/image/upload/PixDrop/example.webp
```

---

# 🕘 Session History

PixDrop includes a dynamic **Session History** section for tracking uploaded files during the current browser session.

The history keeps a relationship between:

| Original File | Generated URL |
| ------------- | ------------- |
| `profile.png` | `https://...` |
| `hero.jpg`    | `https://...` |
| `intro.mp4`   | `https://...` |

### Why keep the original file name?

When multiple files are uploaded, cloud-generated URLs may not make it immediately obvious which URL belongs to which local file.

PixDrop therefore keeps the **original unoptimized filename** in the history table, even when the uploaded asset itself has been converted or optimized.

This makes bulk-upload workflows much easier to document.

---

## 📊 CSV Export

The entire session history can be exported with one click using:

**Download CSV**

The generated file is:

```text
PixDrop_Session_History.csv
```

A typical export looks like:

```csv
Original File Name,Cloud URL
profile.png,https://example.com/profile.webp
hero.jpg,https://example.com/hero.webp
video.mp4,https://example.com/video.mp4
```

### Export behavior

The CSV:

* Contains only the current session's upload records.
* Uses the original file names.
* Includes the generated cloud-hosted URLs.
* Does not require a database.
* Is generated client-side.

---

# ❤️ Support the Creator

PixDrop includes a built-in **"Buy a meal for me"** donation section powered by India's UPI ecosystem.

Users can support the creator through a simple payment workflow without leaving the application.

### 💰 Preset Amounts

Users can choose from predefined amounts:

```text
₹99
₹199
₹299
```

A custom amount can also be entered.

---

## 📱 Mobile Payment Flow

On mobile devices, PixDrop uses a UPI deep link.

After selecting an amount and pressing:

**Continue to Pay**

the application generates a UPI payment URI containing the required payment information.

The device can then open a compatible installed UPI application such as:

* Google Pay
* PhonePe
* Paytm
* Other compatible UPI applications

The selected payment amount is passed through the UPI URI so the user does not need to manually enter it again.

Conceptually, the generated URI follows the UPI payment format:

```text
upi://pay?pa=<PAYEE_VPA>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR
```

> The exact payee information must be configured for the deployment.

---

## 🖥️ Desktop & Tablet Payment Flow

Desktop and tablet devices generally cannot launch mobile UPI applications directly.

PixDrop therefore uses a different workflow.

When the user presses **Continue to Pay**:

1. PixDrop detects that the device is not operating in the mobile payment flow.
2. A QR code is generated directly in the browser.
3. The selected amount is embedded into the UPI payment data.
4. The QR code is displayed on screen.
5. The user scans the QR code using their phone.
6. Their UPI application opens with the payment information pre-filled.

This removes the need to manually type the payment amount.

---

# 🏗️ Architecture

PixDrop follows a lightweight architecture designed around minimal infrastructure.

```text
┌─────────────────────────────────────┐
│             Browser                 │
│                                     │
│  HTML + JavaScript + Tailwind CSS  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Upload Interface              │  │
│  │ Optimization                  │  │
│  │ Preview                       │  │
│  │ Session History               │  │
│  │ CSV Export                    │  │
│  │ UPI Payment                   │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Node.js / Express   │
        │ Application Server  │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │     Cloudinary      │
        │                     │
        │ Storage + Delivery  │
        │ + Media Processing  │
        └─────────────────────┘
```

The application does **not require a persistent application database** for session history.

---

# 🧠 How PixDrop Works

## 1. User selects a file

A user can either:

```text
Drag → Drop
```

or:

```text
Click → Browse → Select File
```

The selected file is read by the browser.

---

## 2. Optimization decision

PixDrop checks whether the **Optimize** option is enabled.

If disabled:

```text
Local File
    ↓
Upload
    ↓
Cloudinary
```

If enabled for an image:

```text
Local Image
    ↓
Optimization
    ↓
WebP Conversion
    ↓
Cloud Upload
    ↓
Cloudinary
```

---

## 3. Cloud upload

The processed file is uploaded to Cloudinary.

Assets are stored within the dedicated:

```text
PixDrop
```

folder.

This gives the application's generated resources a predictable organizational structure.

---

## 4. URL generation

Once Cloudinary successfully processes the upload, PixDrop receives the hosted resource information.

The application then:

* Stores the URL in the current session history.
* Displays the URL to the user.
* Renders a preview.
* Associates the URL with the original file name.

---

## 5. Session tracking

The application maintains upload history in **client-side runtime memory**.

Conceptually:

```javascript
[
  {
    originalName: "profile.png",
    url: "https://..."
  },
  {
    originalName: "hero.jpg",
    url: "https://..."
  }
]
```

No persistent database is necessary for this workflow.

---

# 🛠️ Technology Stack

## Frontend

### HTML5

Used for:

* Application structure
* Upload controls
* Buttons
* Forms
* Tables
* Media previews

---

### JavaScript ES6+

JavaScript powers the application's behavior, including:

* File selection
* Drag-and-drop interactions
* Upload logic
* Optimization workflows
* URL handling
* Session history
* CSV generation
* Device detection
* UPI routing
* QR generation
* UI state updates

---

### Tailwind CSS

Tailwind CSS is used for the visual layer.

It provides:

* Responsive layouts
* Utility-based styling
* Consistent spacing
* Typography
* Buttons
* Cards
* Tables
* Responsive upload interfaces

---

## Icons

The interface uses **Lucide icons** to provide clean and lightweight visual cues.

Icons are used for interactions such as:

* Upload
* Download
* File selection
* Optimization
* Copying URLs
* Payment
* Status indicators

---

## QR Code Generation

PixDrop uses the **QRious** library to generate QR codes directly inside the browser.

The QR code contains the generated UPI payment information, including the selected payment amount.

---

## Backend

### Node.js

Node.js provides the runtime for the server layer.

### Express

Express is used as the lightweight HTTP server responsible for serving/proxying the application and handling backend-side communication where required.

---

## Cloud Storage & Media Processing

### Cloudinary

Cloudinary acts as the external media infrastructure.

It handles:

* Media storage
* Media delivery
* Image transformation
* WebP conversion
* Optimized asset hosting
* Generated public URLs

---

# 📁 Suggested Project Structure

A typical PixDrop project can be organized like this:

```text
PixDrop/
│
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── assets/
│
├── server/
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

> Your actual directory structure may differ. The structure above is a recommended organization for maintaining the project.

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* A Cloudinary account

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
```

Move into the project:

```bash
cd PixDrop
```

---

## 2. Install Dependencies

```bash
npm install
```

This installs the dependencies declared in `package.json`.

---

# 🔐 Environment Variables

Cloudinary credentials and other sensitive configuration values should **never be hard-coded into frontend source files or committed to Git**.

Create a `.env` file in the project root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

For the payment system, configure the creator's payment information according to your implementation.

For example:

```env
UPI_PAYEE_VPA=your-vpa@upi
UPI_PAYEE_NAME=Your Name
```

### `.gitignore`

Make sure `.env` is ignored:

```gitignore
node_modules/
.env
```

---

# ☁️ Cloudinary Configuration

Create a Cloudinary account and obtain the required credentials from the Cloudinary dashboard.

The application should use Cloudinary for media storage and processing rather than exposing private API credentials to the browser.

Assets should be organized under:

```text
PixDrop/
```

A deployment may use a structure such as:

```text
PixDrop/
├── image-1.webp
├── image-2.webp
├── video-1.mp4
└── ...
```

---

# ▶️ Running Locally

Start the application using the script configured in your `package.json`.

For example:

```bash
npm start
```

Or, for a development workflow:

```bash
npm run dev
```

The terminal will provide the local server address.

Typical development addresses may look like:

```text
http://localhost:3000
```

The exact port depends on your server configuration.

---

# 🔄 Upload Workflow

The complete media workflow can be represented as:

```text
                User
                 │
                 ▼
        Select / Drop File
                 │
                 ▼
          Validate File
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
     Optimize?          No
        │                 │
       Yes                │
        │                 │
        ▼                 │
 Image → WebP             │
        │                 │
        └────────┬────────┘
                 ▼
          Upload to Cloudinary
                 │
                 ▼
         Receive Cloud URL
                 │
          ┌──────┴───────┐
          │              │
          ▼              ▼
       Preview       Session History
                         │
                         ▼
                    CSV Export
```

---

# 💳 UPI Workflow

## Mobile

```text
Select Amount
     ↓
Continue to Pay
     ↓
Generate UPI Deep Link
     ↓
Open Installed UPI App
     ↓
Payment Details Pre-filled
```

## Desktop / Tablet

```text
Select Amount
     ↓
Continue to Pay
     ↓
Generate UPI Payment URI
     ↓
Convert URI → QR Code
     ↓
Display QR Code
     ↓
Scan with Phone
     ↓
UPI App Opens
     ↓
Payment Details Pre-filled
```

---

# 📱 Device Detection

PixDrop uses client-side device/environment detection to determine how payment should be presented.

Conceptually:

```text
                 Continue to Pay
                        │
                        ▼
                 Detect Device
                  /          \
                 /            \
             Mobile        Desktop/Tablet
                │                 │
                ▼                 ▼
          UPI Deep Link       Generate QR
                │                 │
                ▼                 ▼
          Open UPI App       Scan with Phone
```

This prevents a desktop user from receiving a payment action designed exclusively for mobile devices.

---

# 🧾 CSV Generation

CSV export is performed client-side using the session history already available in the browser.

Conceptually:

```javascript
const history = [
  {
    originalName: "image.png",
    url: "https://..."
  }
];
```

The application transforms that data into CSV:

```text
Original File Name,Cloud URL
image.png,https://...
```

and triggers a browser download:

```text
PixDrop_Session_History.csv
```

Because the export is client-side, no additional database or export server is required.

---

# 🔒 Privacy & Data Handling

PixDrop is intentionally designed without a persistent application database for upload history.

### Session History

Upload history exists only for the current browser session/runtime.

Refreshing, closing, or otherwise resetting the application's client-side state can remove the history depending on the implementation.

### Media Storage

Uploaded media is stored by **Cloudinary**, not inside the application's local project directory.

Therefore:

```text
Local File
    ↓
PixDrop
    ↓
Cloudinary
    ↓
Hosted URL
```

rather than:

```text
Local File
    ↓
Application Server Disk
```

### Sensitive Credentials

Cloudinary private credentials must remain server-side.

Never expose:

```text
CLOUDINARY_API_SECRET
```

or equivalent private credentials in client-side JavaScript.

---

# 🚨 Error Handling

A production deployment should account for common upload failures such as:

* Unsupported file type
* Missing file
* File too large
* Network failure
* Cloudinary upload failure
* Invalid configuration
* Upload timeout
* Invalid payment amount
* Invalid UPI configuration
* QR generation failure

The interface should communicate failures clearly instead of silently failing.

Example:

```text
Upload failed
Please check your connection and try again.
```

---

# ✅ Recommended Validation

Before uploading a file, PixDrop should validate:

```text
File exists
↓
File type is supported
↓
File size is acceptable
↓
Optimization settings are valid
↓
Upload request is sent
```

For payments:

```text
Amount exists
↓
Amount is numeric
↓
Amount is greater than zero
↓
UPI payee information exists
↓
Payment URI is generated
```

---

# 🚀 Performance

PixDrop is designed around a lightweight architecture.

Performance-focused decisions include:

### Client-side operations

Tasks such as:

* UI state management
* CSV creation
* QR generation
* device detection

can be handled directly inside the browser.

### Cloud processing

Media storage and transformations are delegated to Cloudinary.

This avoids requiring the application server to permanently store large files.

### Minimal infrastructure

No application database is required for session history.

This reduces infrastructure complexity for small deployments.

---

# 📈 Possible Future Improvements

PixDrop can be expanded without changing its core architecture.

Potential additions include:

### Upload Improvements

* Multiple file uploads
* Upload queue
* Progress bars
* Cancel upload
* Retry failed uploads
* File-size indicators
* Copy URL button
* One-click URL sharing

### Image Optimization

* Quality selector
* Output format selector
* JPEG → WebP
* PNG → WebP
* AVIF output
* Automatic responsive image transformations
* Width/height resizing

### Video Processing

* Video compression
* Thumbnail generation
* Format conversion
* Video metadata display

### History

* Persistent local storage
* Search history
* Delete individual records
* Clear session
* Sort/filter uploads
* JSON export

### Authentication

An optional authentication system could allow users to maintain personal upload histories across devices.

### Advanced Cloudinary Features

Possible integrations include:

* Transformations
* Automatic format selection
* Responsive image delivery
* CDN delivery
* Folder management
* Asset tagging
* Metadata

---

# 🧪 Testing Checklist

Before production deployment, test the following:

## Uploads

```text
[ ] Single image upload
[ ] Single video upload
[ ] Drag-and-drop upload
[ ] Browse-based upload
[ ] Multiple uploads
[ ] Invalid file type
[ ] Oversized file
[ ] Network failure
```

## Optimization

```text
[ ] Optimize disabled
[ ] Optimize enabled
[ ] PNG → WebP
[ ] JPG → WebP
[ ] Original file name preserved
[ ] Generated URL works
```

## History

```text
[ ] Uploaded file appears
[ ] Original filename is correct
[ ] Cloud URL is correct
[ ] Multiple entries remain correctly mapped
[ ] CSV downloads correctly
[ ] CSV data matches session history
```

## Payments

```text
[ ] ₹99 selected
[ ] ₹199 selected
[ ] ₹299 selected
[ ] Custom amount
[ ] Invalid amount handling
[ ] Mobile deep-link flow
[ ] Desktop QR flow
[ ] Amount embedded in payment data
[ ] QR scans successfully
```

---

# 🌐 Deployment

PixDrop can be deployed to any environment capable of running a Node.js application and exposing the frontend.

A typical deployment architecture is:

```text
                Internet
                   │
                   ▼
          ┌────────────────┐
          │   PixDrop App  │
          │ Node + Express │
          └───────┬────────┘
                  │
                  ▼
          ┌────────────────┐
          │   Cloudinary   │
          └────────────────┘
```

Before deployment:

```text
✓ Configure environment variables
✓ Configure Cloudinary
✓ Configure UPI payee details
✓ Verify upload handling
✓ Verify HTTPS
✓ Test mobile payment flow
✓ Test desktop QR flow
```

---

# 🔐 Security Considerations

PixDrop should follow basic security practices when deployed publicly.

### Never expose private credentials

Do not place Cloudinary secrets inside:

```text
index.html
app.js
public/
```

### Validate uploads

Do not trust client-side file metadata alone.

Server-side validation should be used wherever uploads pass through or are proxied by the server.

### Use HTTPS

Production deployments should use HTTPS so that uploaded content and application communication are protected in transit.

### Limit uploads

Consider enforcing:

* Maximum file size
* Allowed MIME types
* Upload rate limits
* Cloudinary upload restrictions

### Protect server endpoints

Any backend upload/proxy endpoint should validate requests and reject malformed or unauthorized requests.

---

# 🧩 Design Philosophy

PixDrop intentionally follows a **single-screen utility design**.

The application avoids unnecessary navigation and focuses on one core workflow:

```text
Upload
   ↓
Optimize
   ↓
Generate URL
   ↓
Track
   ↓
Export
```

The interface is designed to minimize the number of actions between selecting a file and receiving a usable URL.

---

# 🎯 Use Cases

PixDrop can be useful for:

* Web developers
* Frontend developers
* Designers
* Content creators
* Students
* Documentation writers
* Portfolio builders
* Social media workflows
* Quick image hosting
* Prototype development
* Website asset management

Example developer workflow:

```text
Screenshot
   ↓
PixDrop
   ↓
Optimize
   ↓
Upload
   ↓
Copy URL
   ↓
Use inside HTML / CSS / Markdown
```

---

# 💡 Example Usage

### HTML

```html
<img
  src="https://res.cloudinary.com/example/image/upload/PixDrop/banner.webp"
  alt="Website banner"
/>
```

### Markdown

```markdown
![Website Banner](https://res.cloudinary.com/example/image/upload/PixDrop/banner.webp)
```

### CSS

```css
.hero {
  background-image: url("https://res.cloudinary.com/example/image/upload/PixDrop/hero.webp");
}
```

---

# 📜 Project Philosophy

PixDrop follows three simple principles:

> **Fast uploads.**

> **Smaller media.**

> **Instantly shareable URLs.**

Instead of building a large media-management platform, PixDrop focuses on doing one workflow efficiently.

---

# 🗺️ Roadmap

```text
[x] Basic media upload
[x] Drag and drop
[x] Cloudinary integration
[x] Image optimization
[x] WebP conversion
[x] URL generation
[x] Session history
[x] CSV export
[x] UPI support
[x] Mobile payment routing
[x] Desktop QR payment
[ ] Multi-file upload queue
[ ] Upload progress indicators
[ ] Persistent history
[ ] Authentication
[ ] Advanced media transformations
[ ] Video optimization
```

---

# 🤝 Contributing

Contributions are welcome.

To contribute:

```bash
git clone <repository-url>
cd PixDrop
npm install
```

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them locally, then commit:

```bash
git add .
git commit -m "Add your feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then open a pull request.

---

# 🐛 Bug Reports

When reporting a bug, include:

* Browser and version
* Operating system
* Device type
* File type
* Approximate file size
* Steps to reproduce the issue
* Expected behavior
* Actual behavior
* Relevant console/server errors

Example:

```text
Browser: Chrome
Device: Windows Desktop
File: PNG
Size: 4.2 MB

Steps:
1. Enable Optimize
2. Drop PNG file
3. Click Upload

Expected:
WebP URL is generated.

Actual:
Upload fails.
```

---

# 📄 License

Choose a license appropriate for your repository before publishing.

For example:

```text
MIT License
```

If using the MIT License, add a `LICENSE` file containing the official license text.

---

# 🙌 Acknowledgements

PixDrop is built with the following technologies and services:

* HTML5
* JavaScript
* Tailwind CSS
* Node.js
* Express
* Cloudinary
* Lucide Icons
* QRious
* UPI

---

# 📬 Project

**PixDrop**
A fast media upload and optimization utility for generating shareable cloud-hosted URLs.

```text
Upload → Optimize → Host → Share
```

Built for developers, creators, and anyone who needs a fast way to turn local media into usable online URLs.
