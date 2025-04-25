docker build -f Dockerfile.dev -t my-app-dev .
docker run -it --rm -v "%cd%:/app" -p 3000:3000 my-app-dev