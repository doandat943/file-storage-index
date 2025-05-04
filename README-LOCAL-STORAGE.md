# OneDrive Vercel Index (Local Storage Version)

This is a modified version of the original OneDrive Vercel Index project that uses local file storage on the server instead of connecting to OneDrive.

## Changes Made

1. **File Storage**:
   - Files are now stored locally in the `file_storage` directory on the server
   - No OneDrive API connection is required

2. **API Endpoints**:
   - `/api` - Lists files and folders
   - `/api/raw` - Serves file content
   - `/api/item` - Gets item details by ID
   - `/api/upload` - New endpoint for uploading files
   - `/api/manage` - New endpoint for file/folder management (create, delete)

3. **Configuration**:
   - Removed OneDrive API configuration
   - Added local storage configuration
   - Redis is no longer required

## Setup

1. Set up the file storage directory path in `config/api.config.js` or through environment variables:
   ```
   FILE_DIRECTORY=./custom_file_storage
   ```

2. Ensure the file storage directory exists and has the appropriate permissions:
   ```bash
   mkdir -p file_storage
   chmod 755 file_storage  # On Linux/macOS
   ```

3. Install dependencies and run the server:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install

   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

## Deployment Options

### Option 1: Deploy with Docker

1. Build the Docker image:
   ```bash
   docker build -t file-index .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -v /path/on/host/file_storage:/app/file_storage file-index
   ```

3. Access the application at http://localhost:3000

### Option 2: Deploy on a VPS/Dedicated Server

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/file-index.git
   cd file-index
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

4. Start the server:
   ```bash
   npm run start
   # or
   yarn start
   # or
   pnpm start
   ```

5. For running as a background service, you can use PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "file-index" -- start
   pm2 save
   pm2 startup
   ```

### Option 3: Deploy with a Reverse Proxy (Nginx)

After setting up the application using Option 1 or 2, you can configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # For larger file uploads
    client_max_body_size 100M;
}
```

## File Management

### Uploading Files

You can upload files using the `/api/upload` endpoint with a multipart form request. Example:

```http
POST /api/upload?path=/path/to/directory
Content-Type: multipart/form-data

files=@file1.jpg&files=@file2.pdf
```

### Creating Folders

You can create folders using the `/api/manage` endpoint:

```http
POST /api/manage?path=/path/to/parent
Content-Type: application/json

{
  "action": "create_folder",
  "name": "new_folder_name"
}
```

### Deleting Files and Folders

You can delete files and folders using the `/api/manage` endpoint:

```http
POST /api/manage?path=/path/to/file.txt
Content-Type: application/json

{
  "action": "delete_file"
}
```

Or for folders:

```http
POST /api/manage?path=/path/to/folder
Content-Type: application/json

{
  "action": "delete_folder"
}
```

## Protected Routes

The protected route functionality still works as before, but now using local `.password` files instead of OneDrive ones. The authentication process works the same way.

## Original Project

The original OneDrive Vercel Index project is a file listing, previewing, and sharing tool that uses OneDrive as the storage. For information about the original project, please refer to the main [README.md](./README.md). 