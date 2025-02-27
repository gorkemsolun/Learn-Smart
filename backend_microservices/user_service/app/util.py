from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from user_service.app.clients import auth
from user_service.app.database.session import get_db, Base, engine
from user_service.app.database.dbmanager import UserDB # put inside get_authenticated_user function to avoid circular import
from user_service.app.database.model import User # registers all tables in SQLAlchemy, import required for table creation

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


async def get_authenticated_user(db, authorization: str = Header(None)):
    """
    Retrieves the authenticated user.

    Args:
        authorization (str): The Authorization header containing the JWT token.

    Returns:
        dict: A dictionary containing the user's data.
    """
    email = await auth.get_authenticated_email(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    current_user = UserDB.fetch(db=db, email=email)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return current_user
