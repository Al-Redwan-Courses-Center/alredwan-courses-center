# Alredwan-courses-center

## Standard Branch Naming
```php-template
feature/<short_description>
fix/<short_description>
docs/<short_description>
```
example:
```php-template
feature/add-student-attendance
fix/fix-enrollment-logic
docs/update-api-endpoints
```


docker compose -f docker-compose.dev.yml down && \
docker rmi -f alredwan-courses-center-redwan-frontend alredwan-courses-center-redwan-backend && \
docker compose -f docker-compose.dev.yml up -d --build && \
docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py migrate && \
docker compose -f docker-compose.dev.yml exec redwan-backend python scripts/seed.py
--------

docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down