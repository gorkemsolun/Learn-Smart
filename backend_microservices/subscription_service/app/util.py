from subscription_service.app.database.session import get_db, Base

def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS chats;"))
            
        Base.metadata.create_all(bind=db.bind)
        
    finally:
        gen.close() # closes the session