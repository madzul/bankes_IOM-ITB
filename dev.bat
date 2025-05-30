docker build -f Dockerfile.dev -t my-app-dev .
docker run -it --rm -v "%cd%:/app" -p 3031:3031 my-app-dev