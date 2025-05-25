<div align="center">
  <img src="./public/header.png" alt="file-storage-index" />
  <h3><a href="https://github.com/doandat943/file-storage-index">file-storage-index</a></h3>
  <p><a href="#quick-start">Get started</a> · <a href="#features">What's available</a> · <a href="#docker-deployment">Docker</a></p>
  <p><em>Local file storage directory listing, powered by Next.js and React</em></p>

  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <a href="https://github.com/doandat943/file-storage-index/discussions"><img src="https://img.shields.io/github/discussions/doandat943/file-storage-index?color=CF2B5B&labelColor=black&logo=github" alt="GitHub Discussions" /></a>
</div>

## TL;DR

Showcase, share, preview, and download files inside *your* local file system with file-storage-index -

- Easy to set up and manage 💸
- Super fast ⚡ and responsive 💦
- Takes less than 15 minutes to setup ⏱️
- Highly customisable ⚒️
- Container ready with Docker 🐳

🍌 More importantly, we are pretty (●'◡'●)

## About This Project

This project is a local file storage index system that provides a web interface to browse, preview, and download files from your local file system. Inspired by various file index solutions, file-storage-index focuses on being lightweight, easy to deploy, and highly customizable.

Key differences from similar projects:
- 100% local focus - no cloud dependencies
- Single container deployment with Docker
- Password protection at folder level
- Built-in file search capabilities
- Modern responsive design

## Demo

Local demo screenshot:

![demo](./public/demo.png)

## Quick start

### Local Installation

1. Clone repository:
```bash
git clone https://github.com/doandat943/file-storage-index.git
cd file-storage-index
```

2. Install dependencies:
```bash
pnpm install
```

3. Configuration:
Copy `.env.example` file to `.env.local` and edit environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
- `FILE_DIRECTORY`: File storage directory (default is './data')

4. Run the application in development mode:
```bash
pnpm dev
```

### Docker Deployment

1. Clone repository:
```bash
git clone https://github.com/doandat943/file-storage-index.git
cd file-storage-index
```

2. Configure environment:
```bash
cp .env.example .env
```
Edit `.env` file to set up your environment variables.

3. Build and run with Docker Compose:
```bash
docker-compose up --build -d
```

The application will be available at http://localhost:3000.

4. Use pre-built Docker image (alternative to steps 1-3):
```bash
# Create a docker-compose.yml file
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  app:
    container_name: file-storage-index
    image: ghcr.io/doandat943/file-storage-index:main
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # Mount your local data directory
      - ./config:/app/config  # Optional: Mount config directory if you want to customize
    environment:
      - FILE_DIRECTORY=./data  # Can be changed to a different directory inside container
EOF

# Run the container
docker-compose up -d
```

## Features

<table>
  <tbody>
    <tr>
      <td>
        <a
          href="#"
          >👀 File preview</a
        >
      </td>
      <td>
        <a
          href="#"
          >💠  List / Grid layouts</a
        >
      </td>
      <td>
        <a
          href="#"
          >🎥 Video and audio</a
        >
      </td>
    </tr>
    <tr>
      <td>PDF, EPUB, markdown, code, plain text</td>
      <td>For previewing images and documents with thumbnails</td>
      <td>mp4, mp3, m4a, ..., play online with subtitles support!</td>
    </tr>
    <tr>
      <td>
        <a
          href="#"
          >📄 Office preview</a
        >
      </td>
      <td><a href="#">📝 README.md preview</a></td>
      <td><a href="#">📑 Pagination</a></td>
    </tr>
    <tr>
      <td>docx, pptx, xlsx, ...</td>
      <td>Also renders code blocks, images with relative links, ...</td>
      <td>For folders with many files</td>
    </tr>
    <tr>
      <td><a href="#">🔒 Protected folders</a></td>
      <td><a href="#">🔎 Native Search</a></td>
      <td><a href="#">🐳 Docker Support</a></td>
    </tr>
    <tr>
      <td>Password protected routes and files</td>
      <td>
        Searching through your local files
      </td>
      <td>
        Easy deployment with Docker and Docker Compose
      </td>
    </tr>
  </tbody>
</table>

... and more:

- Direct file serving and hosting
- Full dark mode support
- Style and website customizations
- Mobile responsive design

> **Note**: This project is focused on showcasing and providing a way for others to download files from your local file system. Emphasis on **simple setup** and **easy customization**.

## Configuration

### Storage Configuration

Edit `config/api.config.js` to set up:
- File storage directory path
- Cache configuration

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

## Docker Commands

View logs:
```bash
docker logs file-storage-index
```

Stop container:
```bash
docker-compose stop
```

Start container:
```bash
docker-compose start
```

Remove container (preserves data volume):
```bash
docker-compose down
```

Access container shell:
```bash
docker exec -it file-storage-index /bin/sh
```

## CI/CD and Container Registry

This project uses GitHub Actions for continuous integration and deployment. Every commit triggers an automatic build and push of Docker images to both GitHub Container Registry and Docker Hub.

### GitHub Actions Workflow

The workflow file `.github/workflows/docker-publish.yml` handles:

1. Building Docker images on every commit
2. Pushing to both GitHub Container Registry and Docker Hub
3. Signing images with Cosign for security verification
4. Tagging images based on branch name and version

To use this workflow in your fork:

1. Set up repository secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub access token
   - `COSIGN_PRIVATE_KEY`: Your Cosign private key
   - `COSIGN_PASSWORD`: Your Cosign password

2. Update the image names in the workflow file to match your username:
   ```yaml
   # Example
   images: |
     ghcr.io/${{ github.repository_owner }}/file-storage-index
     yourusername/file-storage-index
   ```

### Available Docker Images

You can pull ready-to-use Docker images from:

1. **GitHub Container Registry**:
```bash
docker pull ghcr.io/doandat943/file-storage-index:main
```

2. **Docker Hub**:
```bash
docker pull doandat943/file-storage-index:main
```

### Container Tags

- `main`: Latest build from the main branch
- `vX.Y.Z` (e.g., `v1.0.0`): Release versions
- `sha-********`: Specific commit builds

### Security

All images pushed to GitHub Container Registry are signed with Cosign for enhanced supply chain security. This ensures the images you pull are authentic and haven't been tampered with.

## Data Management

The application uses volumes to maintain data persistence across container restarts and updates. Two main volumes are used:

### 1. File Storage Volume

This volume maps to the `/app/data` directory in the container (default location configured in `FILE_DIRECTORY` environment variable). All files you want to serve through the application should be placed in this directory.

```yaml
volumes:
  - ./data:/app/data  # Maps local ./data to container's /app/data
```

### 2. Configuration Volume

This optional volume maps your local configuration directory to the container, allowing customization of:
- API settings (`config/api.config.js`)
- Site settings (`config/site.config.js`) 
- Preview handlers (`config/preview.config.js`)

```yaml
volumes:
  - ./config:/app/config  # Maps local ./config to container's /app/config
```

### Data Backup

To backup your data, simply copy the contents of your `./data` directory. When upgrading to a newer version of the application, your data remains intact as long as you maintain the same volume mappings.

## License

MIT

## Author

Created and maintained by [doandat943](https://github.com/doandat943)

<div align="center">
  <img src="./public/footer.png" />
  <em>made with ❤️ by <a href="https://github.com/doandat943">doandat943</a></em>
</div>