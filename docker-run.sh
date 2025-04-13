#!/bin/bash

# Bash script to run the dockerized LMS application

echo -e "\033[0;32mBuilding and starting the LMS application...\033[0m"

# Build and start the containers
docker-compose up --build -d

echo -e "\033[0;33mContainers are starting up...\033[0m"
echo -e "\033[0;36mFrontend will be available at: http://localhost:3000\033[0m"
echo -e "\033[0;36mBackend API will be available at: http://localhost:5000\033[0m"

echo -e "\n\033[0;37mTo view logs, run: docker-compose logs -f\033[0m"
echo -e "\033[0;37mTo stop the application, run: docker-compose down\033[0m" 