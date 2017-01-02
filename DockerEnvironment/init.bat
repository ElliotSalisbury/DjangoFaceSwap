docker-compose build
docker-compose up -d
docker-compose run web /usr/local/bin/python manage.py migrate