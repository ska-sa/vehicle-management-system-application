# vehicle-management-system-application

These are the key components of the backend and a bit of database so far.

1. 

Database (PostgreSQL)

* Stores all data in tables: users, vehicles, service_history, service_notification

* This could be updated based on the approved ERD.

* Managed through PgAdmin at http://localhost:5050 and Docker.


2. 

FastAPI Backend

* Provides REST API endpoints or routes for operations.
* Runs on http://localhost:800 


How it all connects

1. Docker run these services together:
    * PostgreSQL databse on (port 5432)
    * PgAdmin on (port 5050)
    * FastAPI server(uvicorn) on (Port 8000)

2. The application:
    * Uses SQLAlchemy models to interact with the database (models.py)
    * Provides endpoints that match ERD diagram functions(yet to be approved) (main.py)
    * Validates data with Pydantic schemas (schemas.py)
    * The __init__.py initializes the database.

3. Testing:
    * Since frontend is not integrated, use Thunder Client extension to test the app. Provide a JSON request body for post requests(adding someting in the database).

To start everthing use these commands on the terminal:
    * uvicorn app.main:app
    * docker-compose up -d
    * Make sure you are in the backend directory when running these commands.

Check the docker-compose file for passwords, usernames and databse URL.
