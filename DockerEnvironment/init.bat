docker-compose -f production.yml build
docker-compose -f production.yml up -d
docker-compose -f production.yml run web /usr/local/bin/python manage.py makemigrations FaceSwapApp
docker-compose -f production.yml run web /usr/local/bin/python manage.py migrate