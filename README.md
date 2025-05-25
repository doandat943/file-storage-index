# File Storage Index

A local file management and storage system with web interface, built on Next.js and React.

## Features

- **Local File Storage**: Store and manage files on the local server
- **Preview Common File Formats**: Support for previewing images, videos, audio, and documents
- **Password-Protected Folders**: Set passwords for specific folders
- **Search Files and Folders**: Quick search by name
- **Full API**: RESTful API for integration with other applications
- **Access Control**: Control access through API keys and folder passwords

## System Requirements

- Node.js 14.x or higher
- npm or yarn

## Installation

1. Clone repository:
```bash
git clone https://github.com/doandat943/file-storage-index.git
cd file-storage-index
```

2. Install dependencies:
```bash
npm install
```

3. Configuration:
Copy `.env.example` file to `.env.local` and edit environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
- `API_KEY`: API key to protect endpoints
- `FILE_DIRECTORY`: File storage directory (default is './data')

4. Run the application in development mode:
```bash
npm run dev
```

## Configuration

### Storage Configuration

Edit `config/api.config.js` to set up:
- File storage directory path
- Supported file formats for preview
- Server and cache configuration

### Website Configuration

Edit `config/site.config.js` to set up:
- Website name and icon
- Root shared directory
- Password-protected paths
- Contact information and social links

## API Endpoints

### Files and Folders

- `GET /api?path={path}`: Get file or folder information
- `GET /api/item?id={id}`: Get item information by ID
- `GET /api/raw?path={path}`: Get raw file content
- `GET /api/search?q={query}`: Search for files and folders
- `GET /api/thumbnail?path={path}`: Get file thumbnail

## Security

### Folder Protection

To protect a folder with a password, create a `.password` file in that folder and add the folder path to `protectedRoutes` in `config/site.config.js`.

### API Authentication

Use `X-API-Key` header with the value from the `API_KEY` environment variable to authenticate API requests.

## Development

Run the application in development mode:

```bash
npm run dev
```

Build the application for production:

```bash
npm run build
```

Run the application in production mode:

```bash
npm start
```

## License

MIT

## Author

Created and maintained by [doandat943](https://github.com/doandat943)
