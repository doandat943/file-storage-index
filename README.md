<div align="center">
  <img src="./public/header.png" alt="file-storage-index" />
  <h3><a href="https://github.com/doandat943/file-storage-index">file-storage-index</a></h3>
  <p><a href="#quickstart-guide">Get started</a> · <a href="#features">What's available</a> · <a href="#docker-guide">Docker</a></p>
  <p><em>Local file storage directory listing, powered by Next.js and React</em></p>

  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <a href="https://github.com/doandat943/file-storage-index/discussions"><img src="https://img.shields.io/github/discussions/doandat943/file-storage-index?color=CF2B5B&labelColor=black&logo=github" alt="GitHub Discussions" /></a>
</div>

## 📖 Introduction

**file-storage-index** is a fork of [onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index), reimagined for local file systems instead of Microsoft OneDrive cloud storage. This lightweight web application lets you browse, preview, and share files from your local storage with a modern, responsive interface.

- 🚀 **Simple deployment** with Docker or Node.js
- 🔍 Built-in search and file preview capabilities
- 🔒 Password protection at folder level
- 📱 Modern responsive design for all devices
- 🎬 Rich media support (video/audio streaming, office docs, PDFs)
- 💯 Zero cloud dependencies - runs entirely on your machine

Perfect for home media servers, personal file sharing, or any scenario where you need a beautiful interface to your local files.

## 🎮 Demo

![demo](./public/demo.png)

## ✨ Features

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

## 🚀 Quickstart Guide

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
Copy `.env.example` file to `.env` and edit environment variables:
```bash
cp .env.example .env
```

Required environment variables:
- `STORAGE_ROOT`: File storage directory (default is './data')

4. Run the application in development mode:
```bash
pnpm dev
```

## 🐳 Docker Guide

This section covers all aspects of using file-storage-index with Docker.

### Building from Source

If you prefer to build the Docker image from source:

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

### Quick Deployment

The fastest way to get started with these images:

1. Create a `docker-compose.yml` file with the following content:

```yaml
version: '3'

services:
  file-storage-index:
    image: doandat943/file-storage-index:main
    container_name: file-storage-index
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - file-storage-data:/app/data
    ports:
      - "3000:3000"

volumes:
  file-storage-data:
```

2. Run the container:
```bash
docker-compose up -d
```

The application will be available at http://localhost:3000.

### Updating Docker Containers

To update your container to the latest image version:

1. Pull the latest image:
```bash
docker pull doandat943/file-storage-index:main
```

2. Stop and remove the current container (your data will be preserved):
```bash
docker-compose down
```

3. Start the container with the new image:
```bash
docker-compose up -d
```

4. Verify that the new container is running:
```bash
docker ps
```

Note: Your data will remain intact as long as you've properly configured volumes in your docker-compose.yml file.

### Common Docker Commands

Here are the most frequently used commands for managing your container:

```bash
# View logs
docker logs file-storage-index

# Stop container
docker-compose stop

# Start container
docker-compose start

# Remove container (preserves data volume)
docker-compose down

# Access container shell
docker exec -it file-storage-index /bin/sh
```

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- Every commit triggers automatic builds and pushes to GitHub Container Registry and Docker Hub
- The workflow file `.github/workflows/docker-publish.yml` handles building, pushing, and signing images
- Images are signed with Cosign for security verification

If you fork this project and want to use the CI/CD pipeline, set up these repository secrets:
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token

## ⚙️ Configuration Options

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

### Folder Protection

To protect a folder with a password:

1. Create a `.password` file in the folder you want to protect
2. Add the folder path to `protectedRoutes` in `config/site.config.js`

## 🔌 API Reference

### Available Endpoints

- `GET /api?path={path}`: Get file or folder information
- `GET /api/item?id={id}`: Get item information by ID
- `GET /api/raw?path={path}`: Get raw file content
- `GET /api/search?q={query}`: Search for files and folders
- `GET /api/thumbnail?path={path}`: Get file thumbnail

## 📄 License

MIT

## 👨‍💻 Author

Created and maintained by [doandat943](https://github.com/doandat943)

<div align="center">
  <img src="./public/footer.png" />
  <em>made with ❤️ by <a href="https://github.com/doandat943">doandat943</a></em>
</div>