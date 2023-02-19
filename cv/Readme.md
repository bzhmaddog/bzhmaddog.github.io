#Build image

- docker-compose build

#Run container

- docker-compose up -d

#Install dependencies

- docker-compose exec node npm install


#Build css

- docker-compose exec gulp

#Watch changes in sass files (not working on windows)

- docker-compose exec gulp watch