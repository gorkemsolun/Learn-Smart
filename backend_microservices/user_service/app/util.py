from fastapi import HTTPException, Header
from sqlalchemy import text

from user_service.app.clients import auth as auth_client
from user_service.app.database.session import get_db, Base, engine

# This registers all tables in SQLAlchemy Base.metadata, required for table creation
from user_service.app.model import User 

def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            # drop "users" table
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS users;"))
            db.commit()
            
        # create "users" table
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
    finally:
        gen.close() # closes the session


async def get_authenticated_user(authorization: str = Header(None)):
    """
    Retrieves the authenticated user.

    Args:
        authorization (str): The Authorization header containing the JWT token.

    Returns:
        dict: A dictionary containing the user's data.
    """
    email = await auth_client.get_authenticated_email(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    from user_service.app.database.dbmanager import UserDB
    current_user = UserDB.fetch(email=email)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return current_user
