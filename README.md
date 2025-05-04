# File Storage Index

A modern file storage explorer built with Next.js. This application allows you to browse and interact with files on your local filesystem through a clean, responsive web interface.

## Features

- 📁 Browse local file system through a web interface
- 🖼️ Preview support for images, videos, audio, PDF, markdown, code, and more
- 🔍 Full-text search capabilities
- 📱 Responsive design that works on desktop and mobile
- 🎨 Multiple themes support
- 🔐 Password protection for specific folders
- 📊 File metadata display

## Getting Started

### Prerequisites

- Node.js 16.x or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/doandat943/file-storage-index.git
   cd file-storage-index
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a file storage directory:
   ```bash
   mkdir file_storage
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Build for production:
   ```bash
   pnpm build
   pnpm start
   ```

## Configuration

The application can be configured by modifying the files in the `config` directory:

- `api.config.js` - API and storage configuration
- `site.config.js` - Website appearance and behavior configuration

## Customization

You can customize the application by:

1. Modifying the themes in `config/site.config.js`
2. Changing the logo in the `public` directory
3. Updating the footer text in `config/site.config.js`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

This project was adapted from [onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index) and modified to work with local file storage instead of OneDrive.
